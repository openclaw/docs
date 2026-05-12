---
read_when:
    - Додавання/змінення кінцевих точок
    - Налагодження запитів CLI ↔ реєстру
summary: Довідник HTTP API (публічні кінцеві точки + кінцеві точки CLI + автентифікація).
x-i18n:
    generated_at: "2026-05-12T00:57:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

Базова URL-адреса: `https://clawhub.ai` (за замовчуванням).

Усі шляхи v1 розміщені під `/api/v1/...`.
Застарілі `/api/...` і `/api/cli/...` залишаються для сумісності (див. `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Повторне використання публічного каталогу

Сторонні каталоги можуть використовувати публічні кінцеві точки читання, щоб показувати список або шукати навички ClawHub. Будь ласка, кешуйте результати, дотримуйтеся `429`/`Retry-After`, спрямовуйте користувачів назад до канонічного запису ClawHub (`https://clawhub.ai/<owner>/<slug>`) і не створюйте враження, що ClawHub схвалює сторонній сайт. Не намагайтеся дзеркалити прихований, приватний або заблокований модерацією вміст поза публічною поверхнею API.

Вебскорочення slug розв’язуються між родинами реєстру, але клієнтам API слід використовувати
канонічні URL-адреси, які повертають кінцеві точки читання, замість реконструювання пріоритету
маршрутів.

## Обмеження частоти

Модель застосування:

- Анонімні запити: застосовується за IP.
- Автентифіковані запити (дійсний Bearer-токен): застосовується за кошиком користувача.
- Якщо токен відсутній/недійсний, поведінка повертається до застосування за IP.
- Автентифіковані кінцеві точки запису не повинні повертати голе `Unauthorized`, коли
  сервер знає причину. Відсутні токени, недійсні/відкликані токени та
  видалені/забанені/вимкнені облікові записи мають отримувати дієвий текст, щоб CLI
  клієнти могли повідомити користувачам, що їх заблокувало.

- Читання: 600/хв на IP, 2400/хв на ключ
- Запис: 45/хв на IP, 180/хв на ключ
- Завантаження: 30/хв на IP, 180/хв на ключ (`/api/v1/download`)

Заголовки:

- Сумісність із застарілим форматом: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Стандартизовані: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- На `429`: `Retry-After`

Семантика заголовків:

- `X-RateLimit-Reset`: абсолютні секунди епохи Unix
- `RateLimit-Reset`: секунди до скидання (затримка)
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

- Якщо існує `Retry-After`, зачекайте вказану кількість секунд перед повторною спробою.
- Використовуйте відступ із джитером, щоб уникнути синхронізованих повторних спроб.
- Якщо `Retry-After` відсутній, поверніться до `RateLimit-Reset` (або обчисліть із `X-RateLimit-Reset`).

Джерело IP:

- За замовчуванням використовує `cf-connecting-ip` (Cloudflare) для IP клієнта.
- ClawHub використовує довірені заголовки переспрямування, щоб визначати IP клієнтів на edge.
- Якщо довірений IP клієнта недоступний, анонімні запити завантаження використовують резервний кошик із прив’язкою до кінцевої точки замість одного глобального кошика `ip:unknown`. Анонімні запити читання/запису все ще використовують спільний невідомий кошик, щоб маршрутизація з відсутнім IP залишалася видимою й консервативною.

## Публічні кінцеві точки (без автентифікації)

### `GET /api/v1/search`

Параметри запиту:

- `q` (обов’язково): рядок запиту
- `limit` (необов’язково): ціле число
- `highlightedOnly` (необов’язково): `true`, щоб фільтрувати лише виділені навички
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
      "updatedAt": 1730000000000
    }
  ]
}
```

Примітки:

- Результати повертаються в порядку релевантності (подібність embedding + підсилення точних токенів slug/назви + попередній пріоритет популярності з завантажень).
- Релевантність сильніша за популярність. Точний збіг slug або токена відображуваної назви може обійти менш точний збіг із набагато більшою кількістю завантажень.
- ASCII-текст токенізується за межами слів і пунктуації. Наприклад, `personal-map` містить окремий токен `map`, тоді як `amap-jsapi-skill` містить `amap`, `jsapi` і `skill`; тому пошук `map` дає `personal-map` сильніший лексичний збіг, ніж `amap-jsapi-skill`.
- Завантаження використовуються як невеликий логарифмічно масштабований попередній пріоритет і критерій розв’язання нічиєї, а не як основний сигнал ранжування. Навички з великою кількістю завантажень можуть ранжуватися нижче, коли текст запиту має слабший збіг.
- Підозрілий або прихований стан модерації може вилучити навичку з публічного пошуку залежно від фільтрів викликача та поточного стану модерації.

Рекомендації щодо видимості для видавців:

- Додавайте терміни, які користувачі буквально шукатимуть, у відображувану назву, підсумок і теги. Використовуйте окремий токен slug лише тоді, коли це також стабільна ідентичність, яку ви хочете зберегти.
- Не перейменовуйте slug лише для того, щоб наздогнати один запит, якщо новий slug не є кращою довгостроковою канонічною назвою. Старі slug стають псевдонімами перенаправлення, але канонічна URL-адреса, показаний slug і майбутні пошукові дайджести використовують новий slug.
- Псевдоніми перейменування зберігають розв’язання для старих URL-адрес і встановлень, що розв’язуються через реєстр, але пошукове ранжування базується на канонічних метаданих навички після індексації перейменування. Наявна статистика залишається з навичкою.
- Якщо навичка несподівано невидима, спершу перевірте стан модерації за допомогою `clawhub inspect <slug>` під час входу в систему, перш ніж змінювати метадані, пов’язані з ранжуванням.

### `GET /api/v1/skills`

Параметри запиту:

- `limit` (необов’язково): ціле число (1–200)
- `cursor` (необов’язково): курсор пагінації для будь-якого сортування, крім `trending`
- `sort` (необов’язково): `updated` (за замовчуванням), `createdAt` (псевдонім: `newest`), `downloads`, `stars` (псевдонім: `rating`), `installsCurrent` (псевдонім: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (необов’язково): `true`, щоб приховати підозрілі (`flagged.suspicious`) навички
- `nonSuspicious` (необов’язково): застарілий псевдонім для `nonSuspiciousOnly`

Примітки:

- `trending` ранжує за встановленнями за останні 7 днів (на основі телеметрії).
- `createdAt` стабільний для обходів нових навичок; `updated` змінюється, коли наявні навички публікуються повторно.
- Коли `nonSuspiciousOnly=true`, сортування на основі курсора може повертати менше ніж `limit` елементів на сторінці, оскільки підозрілі навички фільтруються після отримання сторінки.
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

Повідомити про навичку для перевірки модератором. Звіти мають рівень навички, необов’язково пов’язані
з версією та потрапляють до черги звітів про навички.

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

Кінцева точка модератора/адміністратора для приймання звітів про навички.

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

Кінцева точка модератора/адміністратора для вирішення або повторного відкриття звітів про навички.

Запит:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` є обов’язковим для `confirmed` і `dismissed`; його можна опустити під час
повернення `status` до `open`. Передайте `finalAction: "hide"` із тріажованим
звітом, щоб приховати навичку в тому самому аудитовуваному робочому процесі.

### `GET /api/v1/skills/{slug}/versions`

Параметри запиту:

- `limit` (необов’язково): ціле число
- `cursor` (необов’язково): курсор пагінації

### `GET /api/v1/skills/{slug}/versions/{version}`

Повертає метадані версії + список файлів.

- `version.security` включає нормалізований стан перевірки сканування та деталі сканера
  (VirusTotal + LLM), коли доступно.

### `GET /api/v1/skills/{slug}/scan`

Повертає деталі перевірки сканування безпеки для версії навички.

Параметри запиту:

- `version` (необов’язково): конкретний рядок версії.
- `tag` (необов’язково): розв’язати теговану версію (наприклад, `latest`).

Примітки:

- Якщо не надано ні `version`, ні `tag`, використовується остання версія.
- Включає нормалізований стан перевірки плюс специфічні для сканера деталі.
- `security.capabilityTags` включає детерміновані мітки можливостей/ризиків, такі як
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` і `posts-externally`, коли їх виявлено.
- `security.hasScanResult` дорівнює `true` лише тоді, коли сканер створив остаточний вердикт (`clean`, `suspicious` або `malicious`).
- `moderation` — це поточний знімок модерації на рівні навички, отриманий з останньої версії.
- Під час запиту історичної версії перевірте `moderation.matchesRequestedVersion` і `moderation.sourceVersion`, перш ніж вважати `moderation` і `security` контекстом однієї версії.

### `GET /api/v1/skills/{slug}/file`

Повертає необроблений текстовий вміст.

Параметри запиту:

- `path` (обов’язково)
- `version` (необов’язково)
- `tag` (необов’язково)

Примітки:

- За замовчуванням використовується остання версія.
- Обмеження розміру файлу: 200KB.

### `GET /api/v1/packages`

Уніфікована кінцева точка каталогу для:

- навичок
- Plugin коду
- bundle plugins

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
  (необов’язково): скорочення `true`/`1` для тегів вимог середовища
- `externalService`, `binary`, `osPermission` (необов’язково): скорочення для іменованих
  тегів вимог середовища
- `artifactKind` (необов’язково): `legacy-zip` або `npm-pack`
- `npmMirror` (необов’язково): `true`/`1`, щоб показати версії пакетів на базі ClawPack,
  доступні через npm-дзеркало

Примітки:

- `GET /api/v1/code-plugins` і `GET /api/v1/bundle-plugins` залишаються псевдонімами фіксованих сімейств.
- Записи Skills і далі підтримуються реєстром Skills та все ще можуть публікуватися лише через `POST /api/v1/skills`.
- `POST /api/v1/packages` і далі призначений лише для випусків code-plugin і bundle-plugin.
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
  `osPermission` приймаються як скорочення для поширених тегів можливостей
- `artifactKind` (необов’язково): `legacy-zip` або `npm-pack`
- `npmMirror` (необов’язково): `true`/`1` для пошуку версій пакетів на базі ClawPack,
  доступних через npm-дзеркало

Примітки:

- Анонімні викликачі бачать лише публічні канали пакетів.
- Автентифіковані викликачі можуть шукати приватні пакети для видавців, до яких вони належать.
- `channel=private` повертає лише пакети, які автентифікований викликач може читати.
- Фільтри артефактів підтримуються індексованими тегами можливостей:
  `artifact:legacy-zip`, `artifact:npm-pack` і `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Повертає докладні метадані пакета.

Примітки:

- Skills також можуть розв’язуватися через цей маршрут в уніфікованому каталозі.
- Приватні пакети повертають `404`, якщо викликач не може читати видавця-власника.

### `DELETE /api/v1/packages/{name}`

Виконує м’яке видалення пакета та всіх випусків.

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
можливостями, верифікацією, метаданими артефакта та даними сканування.

Примітки:

- `version.artifact.kind` має значення `legacy-zip` для архівів пакетів старого формату або
  `npm-pack` для випусків на базі ClawPack.
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
  `tarballUrl` і URL сумісності із застарілим ZIP.
- Це поверхня розв’язувача OpenClaw; вона уникає вгадування формату архіву зі
  спільного URL.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Завантажує артефакт версії через явний шлях розв’язувача.

Примітки:

- Версії ClawPack потоково передають точні байти завантаженого npm-pack `.tgz`.
- Застарілі ZIP-версії перенаправляють до `/api/v1/packages/{name}/download?version=`.
- Використовує кошик обмеження швидкості завантажень.

### `GET /api/v1/packages/{name}/readiness`

Повертає обчислену готовність для майбутнього споживання OpenClaw.

Перевірки готовності охоплюють:

- статус офіційного каналу
- доступність останньої версії
- доступність артефакта ClawPack npm-pack
- дайджест артефакта
- походження репозиторію джерела та коміту
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
- `packageName` нормалізується як npm-ім’я; пакет може бути відсутній для запланованих
  міграцій.
- Це відстежує лише готовність міграції. Воно не змінює OpenClaw і не генерує
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Кінцева точка модератора/адміністратора для черг перегляду випусків пакетів.

Автентифікація:

- Потрібен API-токен користувача-модератора або адміністратора.

Параметри запиту:

- `status` (необов’язково): `open` (за замовчуванням), `blocked`, `manual` або `all`
- `limit` (необов’язково): ціле число (1-100)
- `cursor` (необов’язково): курсор пагінації

Значення статусів:

- `open`: підозрілі, шкідливі, очікувані, ізольовані, відкликані або повідомлені випуски.
- `blocked`: ізольовані, відкликані або шкідливі випуски.
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

Повідомляє про пакет для перегляду модератором. Звіти мають рівень пакета й можуть
необов’язково бути пов’язані з версією. Вони надходять до черги модерації, але самі по собі не приховують автоматично і не
блокують завантаження; модератори мають використовувати модерацію випусків, щоб
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

`note` є обов’язковим для `confirmed` і `dismissed`; його можна пропустити під час
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

- `approved`: перевірено вручну та дозволено.
- `quarantined`: заблоковано до подальшого розгляду.
- `revoked`: заблоковано після того, як реліз раніше вважався довіреним.

Релізи в карантині та відкликані релізи повертають `403` з маршрутів завантаження артефактів.
Кожна зміна записує запис журналу аудиту.

### `POST /api/v1/packages/backfill/artifacts`

Адміністративна кінцева точка обслуговування лише для адміністраторів для позначення старіших релізів пакетів
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

- За замовчуванням працює в режимі dry-run.
- Релізи без сховища ClawPack позначаються як `legacy-zip`.
- Наявні рядки, backed by ClawPack, у яких відсутній `artifactKind`, відновлюються як
  `npm-pack`.
- Це не генерує ClawPack і не змінює байти артефактів.

### `GET /api/v1/packages/{name}/file`

Повертає необроблений текстовий вміст для файла пакета.

Параметри запиту:

- `path` (обов’язково)
- `version` (необов’язково)
- `tag` (необов’язково)

Примітки:

- За замовчуванням використовується останній реліз.
- Використовує read rate bucket, а не download bucket.
- Двійкові файли повертають `415`.
- Обмеження розміру файла: 200 КБ.
- Очікувані сканування VirusTotal не блокують читання; шкідливі релізи все ще можуть утримуватися в іншому місці.
- Приватні пакети повертають `404`, якщо викликач не може читати видавця-власника.

### `GET /api/v1/packages/{name}/download`

Завантажує застарілий детермінований ZIP-архів для релізу пакета.

Параметри запиту:

- `version` (необов’язково)
- `tag` (необов’язково)

Примітки:

- За замовчуванням використовується останній реліз.
- Skills перенаправляють на `GET /api/v1/download`.
- Архіви Plugin/пакетів є zip-файлами з коренем `package/`, щоб старі клієнти OpenClaw
  продовжували працювати.
- Цей маршрут залишається лише ZIP. Він не транслює файли ClawPack `.tgz`.
- Відповіді містять заголовки `ETag`, `Digest`, `X-ClawHub-Artifact-Type` і
  `X-ClawHub-Artifact-Sha256` для перевірок цілісності резолвера.
- Метадані лише з реєстру не вставляються в завантажений архів.
- Очікувані сканування VirusTotal не блокують завантаження; шкідливі релізи повертають `403`.
- Приватні пакети повертають `404`, якщо викликач не є власником.

### `GET /api/npm/{package}`

Повертає npm-сумісний packument для версій пакетів, backed by ClawPack.

Примітки:

- Перелічуються лише версії із завантаженими tarball-файлами ClawPack npm-pack.
- Застарілі версії лише з ZIP навмисно пропущені.
- `dist.tarball`, `dist.integrity` і `dist.shasum` використовують npm-сумісні
  поля, щоб користувачі могли спрямувати npm на дзеркало, якщо захочуть.
- Packument-и scoped package підтримують як `/api/npm/@scope/name`, так і
  закодований шлях запиту npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Транслює точні байти завантаженого tarball-файла ClawPack для клієнтів npm-дзеркала.

Примітки:

- Використовує download rate bucket.
- Заголовки завантаження містять SHA-256 ClawHub плюс метадані npm integrity/shasum.
- Перевірки модерації та доступу до приватних пакетів усе ще застосовуються.

### `GET /api/v1/resolve`

Використовується CLI для зіставлення локального відбитка з відомою версією.

Параметри запиту:

- `slug` (обов’язково)
- `hash` (обов’язково): 64-символьний hex sha256 відбитка пакета

Відповідь:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Завантажує zip версії skill.

Параметри запиту:

- `slug` (обов’язково)
- `version` (необов’язково): рядок semver
- `tag` (необов’язково): назва тегу (наприклад, `latest`)

Примітки:

- Якщо не вказано ні `version`, ні `tag`, використовується остання версія.
- Програмно видалені версії повертають `410`.
- Статистика завантажень рахується як унікальні ідентичності за годину (`userId`, коли API-токен дійсний, інакше IP).

## Кінцеві точки автентифікації (Bearer token)

Усі кінцеві точки вимагають:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Перевіряє токен і повертає handle користувача.

### `POST /api/v1/skills`

Публікує нову версію.

- Бажано: `multipart/form-data` з JSON `payload` + blob-об’єкти `files[]`.
- Також приймається тіло JSON із `files` (на основі storageId).
- Необов’язкове поле payload: `ownerHandle`. Якщо воно присутнє, API
  визначає цього видавця на сервері та вимагає, щоб actor мав доступ до видавця.
- Необов’язкове поле payload: `migrateOwner`. Коли `true` з `ownerHandle`, наявний
  skill може перейти до цього власника, якщо actor є адміністратором/власником у
  поточного та цільового видавців. Без цього явного ввімкнення зміни власника
  відхиляються.

### `POST /api/v1/packages`

Публікує реліз code-plugin або bundle-plugin.

- Вимагає автентифікації Bearer token.
- Бажано: `multipart/form-data` з JSON `payload` + blob-об’єкти `files[]`.
- Також приймається тіло JSON із `files` (на основі storageId).
- Необов’язкове поле payload: `ownerHandle`. Якщо воно присутнє, лише адміністратори можуть публікувати від імені цього власника.

Основні моменти валідації:

- `family` має бути `code-plugin` або `bundle-plugin`.
- Пакети Plugin вимагають `openclaw.plugin.json`. Завантаження ClawPack `.tgz` мають
  містити його в `package/openclaw.plugin.json`.
- Code plugins вимагають `package.json`, метадані репозиторію джерела, метадані коміту джерела,
  метадані схеми конфігурації, `openclaw.compat.pluginApi` і
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` і `openclaw.environment` є необов’язковими метаданими.
- Лише довірені видавці можуть публікувати в канал `official`.
- Публікації від імені іншого все одно перевіряють право на official-channel щодо цільового облікового запису власника.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Програмно видалити / відновити skill (власник, модератор або адміністратор).

Необов’язкове тіло JSON:

```json
{ "reason": "Held for moderation pending legal review." }
```

Якщо присутній, `reason` зберігається як примітка модерації skill і копіюється до журналу аудиту.
Програмні видалення, ініційовані власником, резервують slug на 30 днів, після чого slug може бути заявлений
іншим видавцем. Відповідь видалення містить `slugReservedUntil`, коли застосовується цей строк.
Приховування модератором/адміністратором і видалення з міркувань безпеки не закінчуються таким чином.

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

Лише для адміністраторів. Гарантує, що org publisher існує для handle. Якщо handle все ще вказує на
застарілого shared user/personal publisher, кінцева точка спочатку мігрує його в org publisher.

- Тіло: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Відповідь: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Лише для адміністраторів. Резервує кореневі slug-и та назви пакетів для законного власника без публікації
релізу. Назви пакетів стають приватними placeholder-пакетами без рядків релізів, тож той самий
власник зможе пізніше опублікувати справжній реліз code-plugin або bundle-plugin у цю назву.

- Тіло: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Відповідь: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Кінцеві точки керування slug власника

- `POST /api/v1/skills/{slug}/rename`
  - Тіло: `{ "newSlug": "new-canonical-slug" }`
  - Відповідь: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Тіло: `{ "targetSlug": "canonical-target-slug" }`
  - Відповідь: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Примітки:

- Обидві кінцеві точки вимагають автентифікації API-токеном і працюють лише для власника skill.
- `rename` зберігає попередній slug як redirect alias.
- `merge` приховує source listing і перенаправляє source slug на target listing.

### Кінцеві точки передавання власності

- `POST /api/v1/skills/{slug}/transfer`
  - Тіло: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Відповідь: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Відповідь (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Форма відповіді: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Банить користувача та жорстко видаляє належні йому skills (лише модератор/адміністратор).

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

Знімає бан з користувача та відновлює придатні skills (лише адміністратор).

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

Змінює роль користувача (лише адміністратор).

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

Показує список користувачів або шукає користувачів (лише адміністратор).

Параметри запиту:

- `q` (необов’язково): пошуковий запит
- `query` (необов’язково): псевдонім для `q`
- `limit` (необов’язково): максимум результатів (за замовчуванням 20, максимум 200)

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

Додати/видалити зірку (виділення). Обидві кінцеві точки є ідемпотентними.

Відповіді:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Застарілі кінцеві точки CLI (deprecated)

Все ще підтримуються для старіших версій CLI:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Див. `DEPRECATIONS.md` щодо плану видалення.

## Виявлення реєстру (`/.well-known/clawhub.json`)

CLI може виявляти налаштування реєстру/автентифікації із сайту:

- `/.well-known/clawhub.json` (JSON, бажано)
- `/.well-known/clawdhub.json` (застаріле)

Схема:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Якщо ви самостійно хостите, розмістіть цей файл (або явно задайте `CLAWHUB_REGISTRY`; застаріле `CLAWDHUB_REGISTRY`).
