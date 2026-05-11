---
read_when:
    - Додавання/змінення кінцевих точок
    - Налагодження запитів CLI ↔ реєстру
summary: Довідник HTTP API (публічні кінцеві точки + кінцеві точки CLI + автентифікація).
x-i18n:
    generated_at: "2026-05-11T20:24:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1580df58fe2342858dd2c86ebaf659993157b11508c0fc03530e541bd0118ae
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

Базова URL-адреса: `https://clawhub.ai` (за замовчуванням).

Усі шляхи v1 розташовані під `/api/v1/...`.
Застарілі `/api/...` і `/api/cli/...` залишаються для сумісності (див. `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Повторне використання публічного каталогу

Сторонні каталоги можуть використовувати публічні кінцеві точки читання, щоб показувати список навичок ClawHub або шукати їх. Кешуйте результати, дотримуйтеся `429`/`Retry-After`, скеровуйте користувачів назад до канонічного списку ClawHub (`https://clawhub.ai/<owner>/<slug>`) і не створюйте враження, що ClawHub схвалює сторонній сайт. Не намагайтеся дублювати прихований, приватний або заблокований модерацією вміст поза публічною поверхнею API.

Вебскорочення slug розв’язуються між сімействами реєстру, але клієнтам API слід використовувати
канонічні URL-адреси, які повертають кінцеві точки читання, замість реконструювання пріоритету
маршрутів.

## Обмеження частоти

Модель застосування:

- Анонімні запити: застосовується для кожної IP-адреси.
- Автентифіковані запити (дійсний Bearer token): застосовується для кошика користувача.
- Якщо токен відсутній/недійсний, поведінка повертається до застосування за IP-адресою.
- Автентифіковані кінцеві точки запису не повинні повертати голе `Unauthorized`, коли
  сервер знає причину. Відсутні токени, недійсні/відкликані токени та
  видалені/заблоковані/вимкнені облікові записи мають отримувати дієвий текст, щоб клієнти
  CLI могли пояснити користувачам, що їх заблокувало.

- Читання: 600/хв на IP-адресу, 2400/хв на ключ
- Запис: 45/хв на IP-адресу, 180/хв на ключ
- Завантаження: 30/хв на IP-адресу, 180/хв на ключ (`/api/v1/download`)

Заголовки:

- Сумісність із застарілими клієнтами: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Стандартизовані: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Для `429`: `Retry-After`

Семантика заголовків:

- `X-RateLimit-Reset`: абсолютні секунди епохи Unix
- `RateLimit-Reset`: секунди до скидання (затримка)
- `Retry-After`: секунди очікування перед повторною спробою (затримка) для `429`

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

Поради для клієнта:

- Якщо існує `Retry-After`, зачекайте стільки секунд перед повторною спробою.
- Використовуйте backoff із jitter, щоб уникнути синхронізованих повторних спроб.
- Якщо `Retry-After` відсутній, поверніться до `RateLimit-Reset` (або обчисліть із `X-RateLimit-Reset`).

Джерело IP-адреси:

- За замовчуванням використовує `cf-connecting-ip` (Cloudflare) для IP-адреси клієнта.
- ClawHub використовує довірені заголовки пересилання, щоб визначати IP-адреси клієнтів на edge.
- Якщо довірена IP-адреса клієнта недоступна, анонімні запити на завантаження використовують резервний кошик, обмежений кінцевою точкою, замість одного глобального кошика `ip:unknown`. Анонімні запити читання/запису й надалі використовують спільний невідомий кошик, щоб маршрутизація з відсутньою IP-адресою залишалася видимою та консервативною.

## Публічні кінцеві точки (без автентифікації)

### `GET /api/v1/search`

Параметри запиту:

- `q` (обов’язковий): рядок запиту
- `limit` (необов’язковий): ціле число
- `highlightedOnly` (необов’язковий): `true`, щоб фільтрувати лише до виділених навичок
- `nonSuspiciousOnly` (необов’язковий): `true`, щоб приховати підозрілі (`flagged.suspicious`) навички
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
      "updatedAt": 1730000000000
    }
  ]
}
```

Примітки:

- Результати повертаються в порядку релевантності (схожість embedding + підсилення для точних токенів slug/назви + апріорний пріоритет популярності за завантаженнями).
- Релевантність сильніша за популярність. Точний збіг токена slug або display-name може випередити менш точний збіг із набагато більшою кількістю завантажень.
- Текст ASCII токенізується за межами слів і пунктуації. Наприклад, `personal-map` містить окремий токен `map`, тоді як `amap-jsapi-skill` містить `amap`, `jsapi` і `skill`; тому пошук `map` дає `personal-map` сильніший лексичний збіг, ніж `amap-jsapi-skill`.
- Завантаження використовуються як невеликий логарифмічно масштабований апріорний пріоритет і критерій розв’язання нічиєї, а не як основний сигнал ранжування. Навички з великою кількістю завантажень можуть ранжуватися нижче, коли текст запиту збігається слабше.
- Підозрілий або прихований стан модерації може вилучити навичку з публічного пошуку залежно від фільтрів викликача та поточного статусу модерації.

Поради щодо виявлення для видавців:

- Додавайте терміни, які користувачі буквально шукатимуть, у відображувану назву, короткий опис і теги. Використовуйте окремий токен slug лише тоді, коли це також стабільна ідентичність, яку ви хочете зберегти.
- Не перейменовуйте slug лише заради одного запиту, якщо новий slug не є кращою довгостроковою канонічною назвою. Старі slug стають псевдонімами переспрямування, але канонічна URL-адреса, відображуваний slug і майбутні пошукові дайджести використовують новий slug.
- Псевдоніми перейменування зберігають розв’язання для старих URL-адрес і встановлень, які розв’язуються через реєстр, але пошукове ранжування ґрунтується на канонічних метаданих навички після індексації перейменування. Наявна статистика залишається з навичкою.
- Якщо навичка несподівано невидима, спершу перевірте стан модерації за допомогою `clawhub inspect <slug>` після входу, перш ніж змінювати метадані, пов’язані з ранжуванням.

### `GET /api/v1/skills`

Параметри запиту:

- `limit` (необов’язковий): ціле число (1–200)
- `cursor` (необов’язковий): курсор пагінації для будь-якого сортування, крім `trending`
- `sort` (необов’язковий): `updated` (за замовчуванням), `createdAt` (псевдонім: `newest`), `downloads`, `stars` (псевдонім: `rating`), `installsCurrent` (псевдонім: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (необов’язковий): `true`, щоб приховати підозрілі (`flagged.suspicious`) навички
- `nonSuspicious` (необов’язковий): застарілий псевдонім для `nonSuspiciousOnly`

Примітки:

- `trending` ранжує за встановленнями за останні 7 днів (на основі телеметрії).
- `createdAt` стабільний для обходів нових навичок; `updated` змінюється, коли наявні навички публікуються повторно.
- Коли `nonSuspiciousOnly=true`, сортування на основі курсора можуть повертати на сторінці менше елементів, ніж `limit`, оскільки підозрілі навички фільтруються після отримання сторінки.
- Використовуйте `nextCursor`, щоб продовжити пагінацію, коли він присутній. Коротка сторінка сама по собі не означає кінець результатів.

Відповідь:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
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

- Старі slug, створені потоками перейменування/злиття власника, розв’язуються до канонічної навички.
- `metadata.os`: обмеження ОС, оголошені у frontmatter навички (наприклад, `["macos"]`, `["linux"]`). `null`, якщо не оголошено.
- `metadata.systems`: цільові системи Nix (наприклад, `["aarch64-darwin", "x86_64-linux"]`). `null`, якщо не оголошено.
- `metadata` дорівнює `null`, якщо навичка не має метаданих платформи.
- `moderation` включається лише тоді, коли навичка позначена або її переглядає власник.

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

- Власники та модератори можуть отримувати доступ до подробиць модерації для прихованих навичок.
- Публічні викликачі отримують `200` лише для вже позначених видимих навичок.
- Докази редагуються для публічних викликачів і містять сирі фрагменти лише для власників/модераторів.

### `POST /api/v1/skills/{slug}/report`

Повідомити про навичку для перевірки модератором. Повідомлення стосуються рівня навички, необов’язково пов’язані
з версією та потрапляють до черги повідомлень про навички.

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

### `POST /api/v1/skills/{slug}/appeal`

Кінцева точка власника/видавця навички для оскарження модерації навички.

Автентифікація:

- Потрібен API-токен для власника навички або учасника-видавця.

Запит:

```json
{ "version": "1.2.3", "message": "The flagged command is documented setup." }
```

Оскарження приймаються для прихованих, вилучених, підозрілих, шкідливих або
позначених сканером результатів навичок. ClawHub зберігає одне відкрите оскарження для кожної навички.

Відповідь:

```json
{
  "ok": true,
  "submitted": true,
  "alreadyOpen": false,
  "appealId": "skillAppeals:...",
  "skillId": "skills:...",
  "status": "open"
}
```

### `POST /api/v1/skills/{slug}/rescan`

Запитує повторне сканування безпеки для останньої опублікованої версії навички.

Автентифікація:

- Потрібен API-токен для власника навички, адміністратора видавця, модератора
  платформи або адміністратора платформи.
- Для власників і адміністраторів видавця діє ліміт відновлення власника
  на версію. Для модераторів і адміністраторів платформи він не діє, але ClawHub усе одно дозволяє лише
  одне активне повторне сканування на версію.

Відповідь:

```json
{
  "ok": true,
  "targetKind": "skill",
  "name": "gifgrep",
  "version": "1.2.3",
  "status": "in_progress",
  "remainingRequests": 2,
  "maxRequests": 3,
  "pendingRequestId": "rescanRequests:..."
}
```

### `GET /api/v1/skills/-/reports`

Кінцева точка модератора/адміністратора для приймання повідомлень про навички.

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

Кінцева точка модератора/адміністратора для розв’язання або повторного відкриття повідомлень про навички.

Запит:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` потрібен для `confirmed` і `dismissed`; його можна опустити під час
повернення `status` до `open`. Передайте `finalAction: "hide"` з опрацьованим
повідомленням, щоб приховати навичку в тому самому аудитовному workflow.

### `GET /api/v1/skills/-/appeals`

Кінцева точка модератора/адміністратора для приймання оскаржень щодо навичок.

Параметри запиту:

- `status` (необов’язковий): `open` (за замовчуванням), `accepted`, `rejected` або `all`
- `limit` (необов’язковий): ціле число (1-200)
- `cursor` (необов’язковий): курсор пагінації

### `POST /api/v1/skills/-/appeals/{appealId}/resolve`

Кінцева точка модератора/адміністратора для прийняття, відхилення або повторного відкриття оскарження щодо навички.
`note` потрібен для `accepted` і `rejected`; його можна опустити під час встановлення
`status` назад на `open`. Передайте `finalAction: "restore"` з прийнятим оскарженням,
щоб знову зробити навичку доступною.

### `GET /api/v1/skills/{slug}/versions`

Параметри запиту:

- `limit` (необов’язково): ціле число
- `cursor` (необов’язково): курсор пагінації

### `GET /api/v1/skills/{slug}/versions/{version}`

Повертає метадані версії + список файлів.

- `version.security` містить нормалізований статус перевірки сканування та дані сканера
  (VirusTotal + LLM), якщо доступно.

### `GET /api/v1/skills/{slug}/scan`

Повертає дані перевірки сканування безпеки для версії Skill.

Параметри запиту:

- `version` (необов’язково): конкретний рядок версії.
- `tag` (необов’язково): визначити позначену версію (наприклад `latest`).

Примітки:

- Якщо не вказано ні `version`, ні `tag`, використовується найновіша версія.
- Містить нормалізований статус перевірки, а також дані, специфічні для сканера.
- `security.capabilityTags` містить детерміновані мітки можливостей/ризиків, такі як
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` і `posts-externally`, коли їх виявлено.
- `security.hasScanResult` дорівнює `true` лише тоді, коли сканер видав остаточний вердикт (`clean`, `suspicious` або `malicious`).
- `moderation` — це поточний знімок модерації на рівні Skill, отриманий із найновішої версії.
- Під час запиту історичної версії перевірте `moderation.matchesRequestedVersion` і `moderation.sourceVersion`, перш ніж вважати `moderation` і `security` тим самим контекстом версії.

### `GET /api/v1/skills/{slug}/file`

Повертає необроблений текстовий вміст.

Параметри запиту:

- `path` (обов’язково)
- `version` (необов’язково)
- `tag` (необов’язково)

Примітки:

- За замовчуванням використовується найновіша версія.
- Обмеження розміру файлу: 200KB.

### `GET /api/v1/packages`

Уніфікована кінцева точка каталогу для:

- Skills
- кодових plugins
- пакетних plugins

Параметри запиту:

- `limit` (необов’язково): ціле число (1–100)
- `cursor` (необов’язково): курсор пагінації
- `family` (необов’язково): `skill`, `code-plugin` або `bundle-plugin`
- `channel` (необов’язково): `official`, `community` або `private`
- `isOfficial` (необов’язково): `true` або `false`
- `executesCode` (необов’язково): `true` або `false`
- `capabilityTag` (необов’язково): фільтр можливостей для пакетів Plugin
- `target` / `hostTarget` (необов’язково): скорочення для `host:<target>`
- `os`, `arch`, `libc` (необов’язково): скорочення для фільтрів можливостей хоста
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (необов’язково): скорочення `true`/`1` для міток вимог до середовища
- `externalService`, `binary`, `osPermission` (необов’язково): скорочення для іменованих
  міток вимог до середовища
- `artifactKind` (необов’язково): `legacy-zip` або `npm-pack`
- `npmMirror` (необов’язково): `true`/`1`, щоб показати версії пакетів на основі ClawPack,
  доступні через npm-дзеркало

Примітки:

- `GET /api/v1/code-plugins` і `GET /api/v1/bundle-plugins` залишаються псевдонімами з фіксованою родиною.
- Записи Skills і надалі підтримуються реєстром Skills і все ще можуть публікуватися лише через `POST /api/v1/skills`.
- `POST /api/v1/packages` усе ще призначений лише для випусків code-plugin і bundle-plugin.
- Анонімні викликачі бачать лише публічні канали пакетів.
- Автентифіковані викликачі можуть бачити приватні пакети для видавців, до яких вони належать, у результатах списку/пошуку.
- `channel=private` повертає лише пакети, які автентифікований викликач може читати.

### `GET /api/v1/packages/search`

Уніфікований пошук у каталозі серед Skills + пакетів Plugin.

Параметри запиту:

- `q` (обов’язково): рядок запиту
- `limit` (необов’язково): ціле число (1–100)
- `family` (необов’язково): `skill`, `code-plugin` або `bundle-plugin`
- `channel` (необов’язково): `official`, `community` або `private`
- `isOfficial` (необов’язково): `true` або `false`
- `executesCode` (необов’язково): `true` або `false`
- `capabilityTag` (необов’язково): фільтр можливостей для пакетів Plugin
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` і
  `osPermission` приймаються як скорочення для поширених міток можливостей
- `artifactKind` (необов’язково): `legacy-zip` або `npm-pack`
- `npmMirror` (необов’язково): `true`/`1`, щоб шукати версії пакетів на основі ClawPack,
  доступні через npm-дзеркало

Примітки:

- Анонімні викликачі бачать лише публічні канали пакетів.
- Автентифіковані викликачі можуть шукати приватні пакети для видавців, до яких вони належать.
- `channel=private` повертає лише пакети, які автентифікований викликач може читати.
- Фільтри артефактів підтримуються індексованими мітками можливостей:
  `artifact:legacy-zip`, `artifact:npm-pack` і `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Повертає детальні метадані пакета.

Примітки:

- Skills також можуть визначатися через цей маршрут в уніфікованому каталозі.
- Приватні пакети повертають `404`, якщо викликач не може читати видавця-власника.

### `DELETE /api/v1/packages/{name}`

Виконує м’яке видалення пакета й усіх випусків.

Примітки:

- Потрібен API-токен власника пакета, власника/адміністратора видавця-організації,
  модератора платформи або адміністратора платформи.

### `GET /api/v1/packages/{name}/versions`

Повертає історію версій.

Параметри запиту:

- `limit` (необов’язково): ціле число (1–100)
- `cursor` (необов’язково): курсор пагінації

Примітки:

- Приватні пакети повертають `404`, якщо викликач не може читати видавця-власника.

### `GET /api/v1/packages/{name}/versions/{version}`

Повертає одну версію пакета, включно з метаданими файлів, сумісністю,
можливостями, перевіркою, метаданими артефакта та даними сканування.

Примітки:

- `version.artifact.kind` має значення `legacy-zip` для архівів пакетів старого типу або
  `npm-pack` для випусків на основі ClawPack.
- Випуски ClawPack містять npm-сумісні поля `npmIntegrity`, `npmShasum` і
  `npmTarballName`.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` і `version.staticScan` включаються, коли існують дані сканування.
- Приватні пакети повертають `404`, якщо викликач не може читати видавця-власника.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Повертає явні метадані розв’язувача артефакта для версії пакета.

Примітки:

- Застарілі версії пакетів повертають артефакт `legacy-zip` і застарілий ZIP
  `downloadUrl`.
- Версії ClawPack повертають артефакт `npm-pack`, поля цілісності npm,
  `tarballUrl` і застарілу URL-адресу сумісності ZIP.
- Це поверхня розв’язувача OpenClaw; вона уникає вгадування формату архіву зі
  спільної URL-адреси.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Завантажує артефакт версії через явний шлях розв’язувача.

Примітки:

- Версії ClawPack передають точні байти завантаженого npm-pack `.tgz`.
- Застарілі ZIP-версії перенаправляють на `/api/v1/packages/{name}/download?version=`.
- Використовує бакет ліміту швидкості завантажень.

### `GET /api/v1/packages/{name}/readiness`

Повертає обчислену готовність для майбутнього споживання OpenClaw.

Перевірки готовності охоплюють:

- статус офіційного каналу
- доступність найновішої версії
- доступність артефакта ClawPack npm-pack
- дайджест артефакта
- джерельний репозиторій і походження коміту
- метадані сумісності з OpenClaw
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

- `phase` (необов’язково): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` або
  `all` (за замовчуванням).
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
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Кінцева точка модератора/адміністратора для черг перевірки випусків пакетів.

Автентифікація:

- Потрібен API-токен користувача-модератора або адміністратора.

Параметри запиту:

- `status` (необов’язково): `open` (за замовчуванням), `blocked`, `manual` або `all`
- `limit` (необов’язково): ціле число (1-100)
- `cursor` (необов’язково): курсор пагінації

Значення статусів:

- `open`: підозрілі, шкідливі, очікувані, карантинні, відкликані або зареєстровані у звітах випуски.
- `blocked`: карантинні, відкликані або шкідливі випуски.
- `manual`: будь-який випуск із ручним перевизначенням модерації.
- `all`: будь-який випуск із ручним перевизначенням, станом сканування не `clean` або звітом про пакет.

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

Надіслати звіт про пакет для перевірки модератором. Звіти мають рівень пакета та можуть
необов’язково посилатися на версію. Вони потрапляють до черги модерації, але самі по собі не приховують автоматично й не
блокують завантаження; модератори мають використовувати модерацію випуску, щоб
схвалити артефакти, помістити їх у карантин або відкликати.

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

### `POST /api/v1/packages/{name}/appeal`

Кінцева точка власника/видавця пакета для оскарження модерації випуску.

Автентифікація:

- Потрібен API-токен власника пакета або учасника видавця.

Запит:

```json
{
  "version": "1.2.3",
  "message": "The native binary is signed and matches the linked source release."
}
```

Оскарження приймаються лише для випусків, які перебувають у карантині, відкликані,
підозрілі або шкідливі. ClawHub зберігає одне відкрите оскарження на випуск.

Відповідь:

```json
{
  "ok": true,
  "submitted": true,
  "alreadyOpen": false,
  "appealId": "packageAppeals:...",
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "status": "open"
}
```

### `POST /api/v1/packages/{name}/rescan`

Запитує повторне безпекове сканування для останнього опублікованого випуску пакета.

Автентифікація:

- Потребує API-токен власника пакета, адміністратора видавця, модератора
  платформи або адміністратора платформи.
- На власників і адміністраторів видавця поширюється обмеження відновлення
  власником для кожного випуску. На модераторів і адміністраторів платформи воно не поширюється, але ClawHub все одно дозволяє лише
  одне активне повторне сканування на випуск.

Відповідь:

```json
{
  "ok": true,
  "targetKind": "package",
  "name": "@openclaw/example-plugin",
  "version": "1.2.3",
  "status": "in_progress",
  "remainingRequests": 2,
  "maxRequests": 3,
  "pendingRequestId": "rescanRequests:..."
}
```

### `GET /api/v1/packages/appeals`

Кінцева точка модератора/адміністратора для приймання апеляцій щодо пакетів.

Автентифікація:

- Потребує API-токен користувача-модератора або адміністратора.

Параметри запиту:

- `status` (необов’язково): `open` (типово), `accepted`, `rejected` або `all`
- `limit` (необов’язково): ціле число (1-100)
- `cursor` (необов’язково): курсор пагінації

Відповідь:

```json
{
  "items": [
    {
      "appealId": "packageAppeals:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "message": "The native binary is signed.",
      "status": "open",
      "createdAt": 1730000000000,
      "submitter": {
        "userId": "users:...",
        "handle": "publisher",
        "displayName": "Publisher"
      },
      "resolvedAt": null,
      "resolvedBy": null,
      "resolutionNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/appeals/{appealId}/resolve`

Кінцева точка модератора/адміністратора для прийняття, відхилення або повторного відкриття апеляції.

Запит:

```json
{ "status": "accepted", "note": "False positive confirmed.", "finalAction": "approve" }
```

`note` є обов’язковим для `accepted` і `rejected`; його можна пропустити під час
повернення `status` до `open`. Передайте `finalAction: "approve"` з прийнятою
апеляцією, щоб схвалити відповідний випуск у тому самому аудиторсько відстежуваному робочому процесі.

Відповідь:

```json
{
  "ok": true,
  "appealId": "packageAppeals:...",
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "status": "rejected"
}
```

### `GET /api/v1/packages/reports`

Кінцева точка модератора/адміністратора для приймання звітів щодо пакетів.

Автентифікація:

- Потребує API-токен користувача-модератора або адміністратора.

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

- Потребує API-токен власника пакета, учасника видавця, модератора або
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

Кінцева точка модератора/адміністратора для вирішення або повторного відкриття звітів щодо пакетів.

Запит:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` є обов’язковим для `confirmed` і `dismissed`; його можна пропустити під час
повернення `status` до `open`. Передайте `finalAction: "quarantine"` або
`finalAction: "revoke"` з підтвердженим звітом, щоб застосувати модерацію випуску в
тому самому аудиторсько відстежуваному робочому процесі.

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

Кінцева точка модератора/адміністратора для перевірки випуску пакета.

Запит:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Підтримувані стани:

- `approved`: вручну перевірено й дозволено.
- `quarantined`: заблоковано до подальшого розгляду.
- `revoked`: заблоковано після того, як випуск раніше вважався довіреним.

Випуски в карантині та відкликані випуски повертають `403` із маршрутів завантаження артефактів.
Кожна зміна записує запис журналу аудиту.

### `POST /api/v1/packages/backfill/artifacts`

Адміністративна кінцева точка обслуговування для позначення старіших випусків пакетів
явними метаданими типу артефакту.

Тіло запиту:

```json
{
  "cursor": null,
  "batchSize": 100,
  "dryRun": true
}
```

Відповідь:

```json
{
  "ok": true,
  "scanned": 100,
  "updated": 12,
  "nextCursor": "cursor...",
  "done": false,
  "dryRun": true
}
```

Примітки:

- Типово виконується пробний запуск.
- Випуски без сховища ClawPack позначаються як `legacy-zip`.
- Наявні рядки з підтримкою ClawPack, у яких відсутній `artifactKind`, виправляються як
  `npm-pack`.
- Це не створює ClawPack і не змінює байти артефактів.

### `GET /api/v1/packages/{name}/file`

Повертає необроблений текстовий вміст файлу пакета.

Параметри запиту:

- `path` (обов’язково)
- `version` (необов’язково)
- `tag` (необов’язково)

Примітки:

- Типово використовується останній випуск.
- Використовує кошик ліміту частоти читання, а не кошик завантажень.
- Двійкові файли повертають `415`.
- Обмеження розміру файлу: 200 КБ.
- Очікувані сканування VirusTotal не блокують читання; шкідливі випуски все ще можуть бути приховані в іншому місці.
- Приватні пакети повертають `404`, якщо викликач не може читати видавця-власника.

### `GET /api/v1/packages/{name}/download`

Завантажує застарілий детермінований ZIP-архів для випуску пакета.

Параметри запиту:

- `version` (необов’язково)
- `tag` (необов’язково)

Примітки:

- Типово використовується останній випуск.
- Skills перенаправляються на `GET /api/v1/download`.
- Архіви Plugin/пакетів є zip-файлами з коренем `package/`, щоб старі клієнти OpenClaw
  продовжували працювати.
- Цей маршрут залишається лише ZIP. Він не транслює файли ClawPack `.tgz`.
- Відповіді містять заголовки `ETag`, `Digest`, `X-ClawHub-Artifact-Type` і
  `X-ClawHub-Artifact-Sha256` для перевірок цілісності резолвера.
- Метадані лише з реєстру не вставляються в завантажений архів.
- Очікувані сканування VirusTotal не блокують завантаження; шкідливі випуски повертають `403`.
- Приватні пакети повертають `404`, якщо викликач не є власником.

### `GET /api/npm/{package}`

Повертає npm-сумісний packument для версій пакетів із підтримкою ClawPack.

Примітки:

- Перелічуються лише версії із завантаженими tarball npm-pack ClawPack.
- Застарілі версії лише з ZIP навмисно пропускаються.
- `dist.tarball`, `dist.integrity` і `dist.shasum` використовують npm-сумісні
  поля, щоб користувачі могли спрямувати npm на дзеркало, якщо захочуть.
- Packument пакетів з областю підтримують як `/api/npm/@scope/name`, так і npm
  закодований шлях запиту `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Транслює точні байти завантаженого tarball ClawPack для клієнтів npm-дзеркала.

Примітки:

- Використовує кошик ліміту частоти завантажень.
- Заголовки завантаження містять SHA-256 ClawHub плюс метадані npm integrity/shasum.
- Перевірки модерації та доступу до приватного пакета все ще застосовуються.

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

Завантажує zip версії навички.

Параметри запиту:

- `slug` (обов’язково)
- `version` (необов’язково): рядок semver
- `tag` (необов’язково): назва тегу (наприклад, `latest`)

Примітки:

- Якщо не надано ні `version`, ні `tag`, використовується остання версія.
- М’яко видалені версії повертають `410`.
- Статистика завантажень рахується як унікальні ідентичності за годину (`userId`, коли API-токен дійсний, інакше IP).

## Кінцеві точки автентифікації (Bearer-токен)

Усі кінцеві точки потребують:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Перевіряє токен і повертає ідентифікатор користувача.

### `POST /api/v1/skills`

Публікує нову версію.

- Бажано: `multipart/form-data` з JSON `payload` + blobs `files[]`.
- JSON-тіло з `files` (на основі storageId) також приймається.
- Необов’язкове поле payload: `ownerHandle`. Коли воно наявне, API розв’язує цього
  видавця на серверному боці й вимагає, щоб актор мав доступ до видавця.
- Необов’язкове поле payload: `migrateOwner`. Коли `true` з `ownerHandle`,
  наявна навичка може перейти до цього власника, якщо актор є адміністратором/власником як у
  поточного, так і в цільового видавця. Без цієї явної згоди зміни власника
  відхиляються.

### `POST /api/v1/packages`

Публікує випуск code-plugin або bundle-plugin.

- Потребує автентифікації Bearer-токеном.
- Бажано: `multipart/form-data` з JSON `payload` + blobs `files[]`.
- JSON-тіло з `files` (на основі storageId) також приймається.
- Необов’язкове поле payload: `ownerHandle`. Коли воно наявне, лише адміністратори можуть публікувати від імені цього власника.

Основні моменти валідації:

- `family` має бути `code-plugin` або `bundle-plugin`.
- Пакети Plugin потребують `openclaw.plugin.json`. Завантаження ClawPack `.tgz` мають
  містити його в `package/openclaw.plugin.json`.
- Code plugins потребують `package.json`, метадані репозиторію вихідного коду, метадані коміту вихідного коду, метадані схеми конфігурації, `openclaw.compat.pluginApi` і
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` і `openclaw.environment` є необов’язковими метаданими.
- Лише довірені видавці можуть публікувати в каналі `official`.
- Публікації від імені іншого власника все одно перевіряють право на офіційний канал щодо цільового облікового запису власника.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

М’яко видалити / відновити навичку (власник, модератор або адміністратор).

Необов’язкове JSON-тіло:

```json
{ "reason": "Held for moderation pending legal review." }
```

Коли наявне, `reason` зберігається як примітка модерації навички та копіюється в журнал аудиту.
М’які видалення, ініційовані власником, резервують slug на 30 днів, після чого slug може бути заявлений
іншим видавцем. Відповідь видалення містить `slugReservedUntil`, коли застосовується цей строк дії.
Приховування модератором/адміністратором і безпекові видалення не спливають у такий спосіб.

Відповідь видалення:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Коди стану:

- `200`: гаразд
- `401`: не авторизовано
- `403`: заборонено
- `404`: навичку/користувача не знайдено
- `500`: внутрішня помилка сервера

### `POST /api/v1/users/publisher`

Лише для адміністратора. Гарантує, що org-видавець існує для ідентифікатора. Якщо ідентифікатор усе ще вказує на
застарілого спільного користувача/особистого видавця, кінцева точка спочатку мігрує його в org-видавця.

- Тіло: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Відповідь: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Лише для адміністраторів. Резервує кореневі слаги та імена пакетів для законного власника без публікації
випуску. Імена пакетів стають приватними пакетами-заповнювачами без рядків випусків, тож той самий
власник зможе пізніше опублікувати справжній випуск code-plugin або bundle-plugin під цим іменем.

- Тіло: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Відповідь: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Ендпоїнти керування слагами власника

- `POST /api/v1/skills/{slug}/rename`
  - Тіло: `{ "newSlug": "new-canonical-slug" }`
  - Відповідь: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Тіло: `{ "targetSlug": "canonical-target-slug" }`
  - Відповідь: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Примітки:

- Обидва ендпоїнти потребують автентифікації через API-токен і працюють лише для власника skill.
- `rename` зберігає попередній слаг як псевдонім перенаправлення.
- `merge` приховує вихідний запис і перенаправляє вихідний слаг до цільового запису.

### Ендпоїнти передавання права власності

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

Заборонити користувача та остаточно видалити належні йому skills (лише модератор/адміністратор).

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

Скасувати заборону користувача та відновити придатні skills (лише адміністратор).

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

Додати/видалити зірку (виділення). Обидва ендпоїнти є ідемпотентними.

Відповіді:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Застарілі ендпоїнти CLI (не рекомендовані)

Досі підтримуються для старіших версій CLI:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

План видалення див. у `DEPRECATIONS.md`.

## Виявлення реєстру (`/.well-known/clawhub.json`)

CLI може виявляти налаштування реєстру/автентифікації із сайту:

- `/.well-known/clawhub.json` (JSON, бажано)
- `/.well-known/clawdhub.json` (застаріле)

Схема:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Якщо ви самостійно розгортаєте сервіс, віддавайте цей файл (або явно задайте `CLAWHUB_REGISTRY`; застаріле `CLAWDHUB_REGISTRY`).
