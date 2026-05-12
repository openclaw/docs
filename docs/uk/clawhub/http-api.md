---
read_when:
    - Додавання/зміна кінцевих точок
    - Налагодження запитів CLI ↔ реєстру
summary: Довідник HTTP API (публічні кінцеві точки + кінцеві точки CLI + автентифікація).
x-i18n:
    generated_at: "2026-05-12T04:09:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

Базова URL-адреса: `https://clawhub.ai` (за замовчуванням).

Усі шляхи v1 розташовані під `/api/v1/...`.
Застарілі `/api/...` та `/api/cli/...` зберігаються для сумісності (див. `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Повторне використання публічного каталогу

Сторонні каталоги можуть використовувати публічні кінцеві точки читання, щоб перелічувати або шукати Skills ClawHub. Кешуйте результати, дотримуйтеся `429`/`Retry-After`, спрямовуйте користувачів назад до канонічного списку ClawHub (`https://clawhub.ai/<owner>/<slug>`) і не створюйте враження, що ClawHub схвалює сторонній сайт. Не намагайтеся дзеркалити прихований, приватний або заблокований модерацією вміст поза поверхнею публічного API.

Скорочення веб-слагів розв'язуються між сімействами реєстру, але клієнтам API слід використовувати
канонічні URL-адреси, повернені кінцевими точками читання, замість реконструювання пріоритету
маршрутів.

## Обмеження частоти

Модель застосування:

- Анонімні запити: застосовується за IP.
- Автентифіковані запити (дійсний Bearer-токен): застосовується за кошиком користувача.
- Якщо токен відсутній або недійсний, поведінка повертається до застосування за IP.
- Автентифіковані кінцеві точки запису не повинні повертати лише `Unauthorized`, коли
  сервер знає причину. Відсутні токени, недійсні/відкликані токени та
  видалені/забанені/вимкнені облікові записи мають отримувати дієвий текст, щоб CLI
  клієнти могли повідомити користувачам, що саме їх заблокувало.

- Читання: 600/хв на IP, 2400/хв на ключ
- Запис: 45/хв на IP, 180/хв на ключ
- Завантаження: 30/хв на IP, 180/хв на ключ (`/api/v1/download`)

Заголовки:

- Застаріла сумісність: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
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

Рекомендації для клієнта:

- Якщо `Retry-After` існує, зачекайте вказану кількість секунд перед повторною спробою.
- Використовуйте backoff із jitter, щоб уникати синхронізованих повторних спроб.
- Якщо `Retry-After` відсутній, використайте `RateLimit-Reset` як запасний варіант (або обчисліть із `X-RateLimit-Reset`).

Джерело IP:

- За замовчуванням використовує `cf-connecting-ip` (Cloudflare) для IP клієнта.
- ClawHub використовує довірені заголовки пересилання, щоб ідентифікувати IP клієнтів на edge.
- Якщо довірений IP клієнта недоступний, анонімні запити на завантаження використовують резервний кошик у межах кінцевої точки замість одного глобального кошика `ip:unknown`. Анонімні запити читання/запису все ще використовують спільний невідомий кошик, щоб маршрутизація з відсутнім IP залишалася видимою та консервативною.

## Публічні кінцеві точки (без автентифікації)

### `GET /api/v1/search`

Параметри запиту:

- `q` (обов'язково): рядок запиту
- `limit` (необов'язково): ціле число
- `highlightedOnly` (необов'язково): `true`, щоб фільтрувати лише до виділених Skills
- `nonSuspiciousOnly` (необов'язково): `true`, щоб приховати підозрілі (`flagged.suspicious`) Skills
- `nonSuspicious` (необов'язково): застарілий псевдонім для `nonSuspiciousOnly`

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

- Результати повертаються в порядку релевантності (подібність embedding + підсилення точного токена slug/name + попередній пріоритет популярності з завантажень).
- Релевантність сильніша за популярність. Точний збіг токена слага або відображуваної назви може випередити менш точний збіг із набагато більшою кількістю завантажень.
- ASCII-текст токенізується на межах слів і розділових знаків. Наприклад, `personal-map` містить окремий токен `map`, тоді як `amap-jsapi-skill` містить `amap`, `jsapi` і `skill`; тому пошук `map` дає `personal-map` сильніший лексичний збіг, ніж `amap-jsapi-skill`.
- Завантаження використовуються як невеликий логарифмічно масштабований попередній пріоритет і засіб розв'язання нічиїх, а не як основний сигнал ранжування. Skills із великою кількістю завантажень можуть ранжуватися нижче, коли текст запиту має слабший збіг.
- Підозрілий або прихований стан модерації може вилучити Skill із публічного пошуку залежно від фільтрів викликача та поточного статусу модерації.

Рекомендації щодо видимості для видавців:

- Додавайте терміни, які користувачі буквально шукатимуть, до відображуваної назви, резюме й тегів. Використовуйте окремий токен слага лише тоді, коли він також є стабільною ідентичністю, яку ви хочете зберегти.
- Не перейменовуйте слаг лише для того, щоб наздогнати один запит, якщо новий слаг не є кращою довгостроковою канонічною назвою. Старі слаги стають псевдонімами перенаправлення, але канонічна URL-адреса, показаний слаг і майбутні пошукові дайджести використовують новий слаг.
- Псевдоніми перейменування зберігають розв'язання для старих URL-адрес і встановлень, які розв'язуються через реєстр, але пошукове ранжування базується на канонічних метаданих Skill після індексації перейменування. Наявна статистика залишається зі Skill.
- Якщо Skill несподівано невидимий, спершу перевірте стан модерації за допомогою `clawhub inspect <slug>` після входу в систему, перш ніж змінювати метадані, пов'язані з ранжуванням.

### `GET /api/v1/skills`

Параметри запиту:

- `limit` (необов'язково): ціле число (1–200)
- `cursor` (необов'язково): курсор пагінації для будь-якого сортування, крім `trending`
- `sort` (необов'язково): `updated` (за замовчуванням), `createdAt` (псевдонім: `newest`), `downloads`, `stars` (псевдонім: `rating`), `installsCurrent` (псевдонім: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (необов'язково): `true`, щоб приховати підозрілі (`flagged.suspicious`) Skills
- `nonSuspicious` (необов'язково): застарілий псевдонім для `nonSuspiciousOnly`

Примітки:

- `trending` ранжує за встановленнями за останні 7 днів (на основі телеметрії).
- `createdAt` стабільний для обходів нових Skills; `updated` змінюється, коли наявні Skills публікуються повторно.
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

- Старі слаги, створені потоками перейменування/злиття власника, розв'язуються до канонічного Skill.
- `metadata.os`: обмеження ОС, оголошені у frontmatter Skill (наприклад, `["macos"]`, `["linux"]`). `null`, якщо не оголошено.
- `metadata.systems`: цільові системи Nix (наприклад, `["aarch64-darwin", "x86_64-linux"]`). `null`, якщо не оголошено.
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

- Власники та модератори можуть отримувати доступ до деталей модерації для прихованих Skills.
- Публічні викликачі отримують `200` лише для вже позначених видимих Skills.
- Докази редагуються для публічних викликачів і містять сирі фрагменти лише для власників/модераторів.

### `POST /api/v1/skills/{slug}/report`

Повідомити про Skill для перегляду модератором. Звіти мають рівень Skill, можуть необов'язково пов'язуватися
з версією та потрапляють у чергу звітів про Skills.

Автентифікація:

- Потребує API-токена.

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

- `status` (необов'язково): `open` (за замовчуванням), `confirmed`, `dismissed` або `all`
- `limit` (необов'язково): ціле число (1-200)
- `cursor` (необов'язково): курсор пагінації

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

Кінцева точка модератора/адміністратора для розв'язання або повторного відкриття звітів про Skills.

Запит:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` обов'язковий для `confirmed` і `dismissed`; його можна опустити під час
повернення `status` до `open`. Передайте `finalAction: "hide"` із тріажованим
звітом, щоб приховати Skill у тому самому придатному для аудиту робочому процесі.

### `GET /api/v1/skills/{slug}/versions`

Параметри запиту:

- `limit` (необов'язково): ціле число
- `cursor` (необов'язково): курсор пагінації

### `GET /api/v1/skills/{slug}/versions/{version}`

Повертає метадані версії + список файлів.

- `version.security` включає нормалізований статус перевірки сканування та деталі сканера
  (VirusTotal + LLM), коли доступно.

### `GET /api/v1/skills/{slug}/scan`

Повертає деталі перевірки сканування безпеки для версії Skill.

Параметри запиту:

- `version` (необов'язково): конкретний рядок версії.
- `tag` (необов'язково): розв'язати теговану версію (наприклад, `latest`).

Примітки:

- Якщо не надано ні `version`, ні `tag`, використовується остання версія.
- Включає нормалізований статус перевірки та специфічні для сканера деталі.
- `security.capabilityTags` включає детерміновані мітки можливостей/ризиків, як-от
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` і `posts-externally`, коли виявлено.
- `security.hasScanResult` дорівнює `true` лише тоді, коли сканер створив остаточний вердикт (`clean`, `suspicious` або `malicious`).
- `moderation` є поточним знімком модерації на рівні Skill, виведеним з останньої версії.
- Під час запиту історичної версії перевірте `moderation.matchesRequestedVersion` і `moderation.sourceVersion`, перш ніж трактувати `moderation` і `security` як контекст тієї самої версії.

### `GET /api/v1/skills/{slug}/file`

Повертає сирий текстовий вміст.

Параметри запиту:

- `path` (обов'язково)
- `version` (необов'язково)
- `tag` (необов'язково)

Примітки:

- За замовчуванням використовується остання версія.
- Обмеження розміру файлу: 200KB.

### `GET /api/v1/packages`

Уніфікована кінцева точка каталогу для:

- Skills
- кодових plugins
- bundle plugins

Параметри запиту:

- `limit` (необов’язково): ціле число (1–100)
- `cursor` (необов’язково): курсор пагінації
- `family` (необов’язково): `skill`, `code-plugin` або `bundle-plugin`
- `channel` (необов’язково): `official`, `community` або `private`
- `isOfficial` (необов’язково): `true` або `false`
- `executesCode` (необов’язково): `true` або `false`
- `capabilityTag` (необов’язково): фільтр можливостей для пакетів plugin
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

- `GET /api/v1/code-plugins` і `GET /api/v1/bundle-plugins` залишаються псевдонімами з фіксованою родиною.
- Записи Skills надалі підтримуються реєстром Skills і все ще можуть публікуватися лише через `POST /api/v1/skills`.
- `POST /api/v1/packages` усе ще призначений лише для релізів code-plugin і bundle-plugin.
- Анонімні викликачі бачать лише публічні канали пакетів.
- Автентифіковані викликачі можуть бачити приватні пакети для видавців, до яких вони належать, у результатах списку/пошуку.
- `channel=private` повертає лише пакети, які автентифікований викликач може читати.

### `GET /api/v1/packages/search`

Уніфікований пошук у каталозі серед Skills + пакетів plugin.

Параметри запиту:

- `q` (обов’язково): рядок запиту
- `limit` (необов’язково): ціле число (1–100)
- `family` (необов’язково): `skill`, `code-plugin` або `bundle-plugin`
- `channel` (необов’язково): `official`, `community` або `private`
- `isOfficial` (необов’язково): `true` або `false`
- `executesCode` (необов’язково): `true` або `false`
- `capabilityTag` (необов’язково): фільтр можливостей для пакетів plugin
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

Повертає метадані деталей пакета.

Примітки:

- Skills також можуть розв’язуватися через цей маршрут в уніфікованому каталозі.
- Приватні пакети повертають `404`, якщо викликач не може читати видавця-власника.

### `DELETE /api/v1/packages/{name}`

Виконує м’яке видалення пакета та всіх релізів.

Примітки:

- Потребує API-токена власника пакета, власника/адміністратора видавця організації,
  модератора платформи або адміністратора платформи.

### `GET /api/v1/packages/{name}/versions`

Повертає історію версій.

Параметри запиту:

- `limit` (необов’язково): ціле число (1–100)
- `cursor` (необов’язково): курсор пагінації

Примітки:

- Приватні пакети повертають `404`, якщо викликач не може читати видавця-власника.

### `GET /api/v1/packages/{name}/versions/{version}`

Повертає одну версію пакета, зокрема метадані файлів, сумісність,
можливості, перевірку, метадані артефакту та дані сканування.

Примітки:

- `version.artifact.kind` дорівнює `legacy-zip` для архівів пакетів старого світу або
  `npm-pack` для релізів на базі ClawPack.
- Релізи ClawPack містять npm-сумісні поля `npmIntegrity`, `npmShasum` і
  `npmTarballName`.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` і `version.staticScan` включаються, коли існують дані сканування.
- Приватні пакети повертають `404`, якщо викликач не може читати видавця-власника.

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

- Версії ClawPack передають потоком точні завантажені байти npm-pack `.tgz`.
- Застарілі ZIP-версії перенаправляють на `/api/v1/packages/{name}/download?version=`.
- Використовує кошик обмеження частоти завантажень.

### `GET /api/v1/packages/{name}/readiness`

Повертає обчислену готовність для майбутнього використання OpenClaw.

Перевірки готовності охоплюють:

- статус офіційного каналу
- доступність останньої версії
- доступність артефакту ClawPack npm-pack
- дайджест артефакту
- джерельний репозиторій і походження коміту
- метадані сумісності з OpenClaw
- цілі хоста
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

Ендпоінт модератора для перелічення рядків міграції офіційних plugin OpenClaw.

Автентифікація:

- Потребує API-токена користувача-модератора або адміністратора.

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

Адміністративний ендпоінт для створення або оновлення рядка міграції офіційного plugin.

Автентифікація:

- Потребує API-токена користувача-адміністратора.

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
- Це відстежує лише готовність міграції. Це не змінює OpenClaw і не генерує
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Ендпоінт модератора/адміністратора для черг перевірки релізів пакетів.

Автентифікація:

- Потребує API-токена користувача-модератора або адміністратора.

Параметри запиту:

- `status` (необов’язково): `open` (типово), `blocked`, `manual` або `all`
- `limit` (необов’язково): ціле число (1-100)
- `cursor` (необов’язково): курсор пагінації

Значення статусів:

- `open`: підозрілі, шкідливі, очікувані, ізольовані, відкликані або заявлені релізи.
- `blocked`: ізольовані, відкликані або шкідливі релізи.
- `manual`: будь-який реліз із ручним перевизначенням модерації.
- `all`: будь-який реліз із ручним перевизначенням, нечистим станом сканування або скаргою на пакет.

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

Надіслати скаргу на пакет для перевірки модератором. Скарги мають рівень пакета й необов’язково
пов’язані з версією. Вони потрапляють до черги модерації, але самі собою не приховують автоматично і не
блокують завантаження; модератори мають використовувати модерацію релізів, щоб
схвалити, ізолювати або відкликати артефакти.

Автентифікація:

- Потребує API-токена.

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

Ендпоінт модератора/адміністратора для приймання скарг на пакети.

Автентифікація:

- Потребує API-токена користувача-модератора або адміністратора.

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

Ендпоінт власника/модератора для видимості модерації пакета.

Автентифікація:

- Потребує API-токена власника пакета, учасника видавця, модератора або
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

Ендпоінт модератора/адміністратора для закриття або повторного відкриття скарг на пакети.

Запит:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` є обов’язковим для `confirmed` і `dismissed`; його можна не вказувати під час
повернення `status` до `open`. Передайте `finalAction: "quarantine"` або
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

Ендпоїнт модератора/адміністратора для перевірки релізу пакета.

Запит:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Підтримувані стани:

- `approved`: вручну перевірено й дозволено.
- `quarantined`: заблоковано до подальшого розгляду.
- `revoked`: заблоковано після того, як реліз раніше вважався довіреним.

Релізи в станах `quarantined` і `revoked` повертають `403` з маршрутів завантаження артефактів.
Кожна зміна записує запис у журнал аудиту.

### `POST /api/v1/packages/backfill/artifacts`

Адміністративний ендпоїнт обслуговування для позначення старіших релізів пакетів
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
- Релізи без сховища ClawPack позначаються як `legacy-zip`.
- Наявні рядки на базі ClawPack без `artifactKind` виправляються як
  `npm-pack`.
- Це не генерує ClawPack і не змінює байти артефактів.

### `GET /api/v1/packages/{name}/file`

Повертає необроблений текстовий вміст файлу пакета.

Параметри запиту:

- `path` (обов’язковий)
- `version` (необов’язковий)
- `tag` (необов’язковий)

Примітки:

- Типово використовується останній реліз.
- Використовує ліміт читання, а не ліміт завантаження.
- Двійкові файли повертають `415`.
- Обмеження розміру файлу: 200 КБ.
- Очікування сканувань VirusTotal не блокує читання; шкідливі релізи все ще можуть бути приховані деінде.
- Приватні пакети повертають `404`, якщо викликач не може читати власника-видавця.

### `GET /api/v1/packages/{name}/download`

Завантажує застарілий детермінований ZIP-архів для релізу пакета.

Параметри запиту:

- `version` (необов’язковий)
- `tag` (необов’язковий)

Примітки:

- Типово використовується останній реліз.
- Skills переспрямовуються на `GET /api/v1/download`.
- Архіви Plugin/пакетів є zip-файлами з коренем `package/`, щоб старі клієнти OpenClaw
  продовжували працювати.
- Цей маршрут залишається лише для ZIP. Він не транслює файли ClawPack `.tgz`.
- Відповіді містять заголовки `ETag`, `Digest`, `X-ClawHub-Artifact-Type` і
  `X-ClawHub-Artifact-Sha256` для перевірок цілісності резолвера.
- Метадані лише з реєстру не впроваджуються в завантажений архів.
- Очікування сканувань VirusTotal не блокує завантаження; шкідливі релізи повертають `403`.
- Приватні пакети повертають `404`, якщо викликач не є власником.

### `GET /api/npm/{package}`

Повертає npm-сумісний packument для версій пакетів на базі ClawPack.

Примітки:

- У списку є лише версії із завантаженими tarball-файлами ClawPack npm-pack.
- Застарілі версії лише ZIP навмисно пропущено.
- `dist.tarball`, `dist.integrity` і `dist.shasum` використовують npm-сумісні
  поля, щоб користувачі могли спрямувати npm на дзеркало, якщо забажають.
- Packument для пакетів зі scope підтримує як `/api/npm/@scope/name`, так і npm-овий
  закодований шлях запиту `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Транслює точні байти завантаженого tarball-файлу ClawPack для клієнтів npm-дзеркала.

Примітки:

- Використовує ліміт завантаження.
- Заголовки завантаження містять SHA-256 ClawHub плюс метадані npm integrity/shasum.
- Перевірки модерації та доступу до приватних пакетів усе ще застосовуються.

### `GET /api/v1/resolve`

Використовується CLI для зіставлення локального відбитка з відомою версією.

Параметри запиту:

- `slug` (обов’язковий)
- `hash` (обов’язковий): 64-символьний hex sha256 відбитка bundle

Відповідь:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Завантажує zip версії навички.

Параметри запиту:

- `slug` (обов’язковий)
- `version` (необов’язковий): рядок semver
- `tag` (необов’язковий): назва тегу (наприклад, `latest`)

Примітки:

- Якщо не вказано ні `version`, ні `tag`, використовується остання версія.
- М’яко видалені версії повертають `410`.
- Статистика завантажень рахується як унікальні ідентичності за годину (`userId`, коли API-токен дійсний, інакше IP).

## Ендпоїнти автентифікації (Bearer-токен)

Усі ендпоїнти потребують:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Перевіряє токен і повертає handle користувача.

### `POST /api/v1/skills`

Публікує нову версію.

- Бажано: `multipart/form-data` з JSON `payload` + blob-ами `files[]`.
- Також приймається JSON-тіло з `files` (на основі storageId).
- Необов’язкове поле payload: `ownerHandle`. Якщо воно присутнє, API розв’язує цього
  видавця на сервері й вимагає, щоб актор мав доступ до видавця.
- Необов’язкове поле payload: `migrateOwner`. Коли `true` разом з `ownerHandle`, наявну
  навичку можна перемістити до цього власника, якщо актор є адміністратором/власником і в поточного,
  і в цільового видавця. Без цієї явної згоди зміни власника
  відхиляються.

### `POST /api/v1/packages`

Публікує реліз code-plugin або bundle-plugin.

- Потребує автентифікації Bearer-токеном.
- Бажано: `multipart/form-data` з JSON `payload` + blob-ами `files[]`.
- Також приймається JSON-тіло з `files` (на основі storageId).
- Необов’язкове поле payload: `ownerHandle`. Якщо воно присутнє, лише адміністратори можуть публікувати від імені цього власника.

Основні моменти валідації:

- `family` має бути `code-plugin` або `bundle-plugin`.
- Пакети Plugin потребують `openclaw.plugin.json`. Завантаження ClawPack `.tgz` мають
  містити його в `package/openclaw.plugin.json`.
- Code plugins потребують `package.json`, метаданих репозиторію джерел, метаданих коміту джерел,
  метаданих схеми конфігурації, `openclaw.compat.pluginApi` і
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` і `openclaw.environment` є необов’язковими метаданими.
- Лише довірені видавці можуть публікувати в канал `official`.
- Публікації від імені іншого користувача все одно перевіряють право на канал official щодо облікового запису цільового власника.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

М’яко видаляє / відновлює навичку (власник, модератор або адміністратор).

Необов’язкове JSON-тіло:

```json
{ "reason": "Held for moderation pending legal review." }
```

Якщо присутнє, `reason` зберігається як нотатка модерації навички та копіюється в журнал аудиту.
М’які видалення, ініційовані власником, резервують slug на 30 днів, після чого slug може бути заявлений
іншим видавцем. Відповідь видалення містить `slugReservedUntil`, коли застосовується цей строк.
Приховування модератором/адміністратором і видалення з міркувань безпеки таким способом не спливають.

Відповідь видалення:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Коди стану:

- `200`: ok
- `401`: не автентифіковано
- `403`: заборонено
- `404`: навичку/користувача не знайдено
- `500`: внутрішня помилка сервера

### `POST /api/v1/users/publisher`

Лише для адміністратора. Забезпечує існування org-видавця для handle. Якщо handle все ще вказує на
застарілого спільного користувацького/персонального видавця, ендпоїнт спершу мігрує його в org-видавця.

- Тіло: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Відповідь: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Лише для адміністратора. Резервує кореневі slug-и та назви пакетів для законного власника без публікації
релізу. Назви пакетів стають приватними пакетами-заповнювачами без рядків релізів, тож той самий
власник може пізніше опублікувати справжній реліз code-plugin або bundle-plugin під цією назвою.

- Тіло: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Відповідь: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Ендпоїнти керування slug-ами власника

- `POST /api/v1/skills/{slug}/rename`
  - Тіло: `{ "newSlug": "new-canonical-slug" }`
  - Відповідь: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Тіло: `{ "targetSlug": "canonical-target-slug" }`
  - Відповідь: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Примітки:

- Обидва ендпоїнти потребують автентифікації API-токеном і працюють лише для власника навички.
- `rename` зберігає попередній slug як redirect-аліас.
- `merge` приховує початковий listing і переспрямовує початковий slug на цільовий listing.

### Ендпоїнти передавання власності

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

Банить користувача й безповоротно видаляє належні йому навички (лише модератор/адміністратор).

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

Знімає бан з користувача й відновлює придатні навички (лише адміністратор).

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

Виводить список користувачів або шукає користувачів (лише адміністратор).

Параметри запиту:

- `q` (необов’язковий): пошуковий запит
- `query` (необов’язковий): alias для `q`
- `limit` (необов’язковий): максимум результатів (типово 20, максимум 200)

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

Додає/видаляє зірку (highlights). Обидва ендпоїнти є ідемпотентними.

Відповіді:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Застарілі ендпоїнти CLI (застаріло)

Усе ще підтримуються для старіших версій CLI:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Див. `DEPRECATIONS.md` щодо плану вилучення.

## Виявлення реєстру (`/.well-known/clawhub.json`)

CLI може виявляти налаштування реєстру/автентифікації із сайту:

- `/.well-known/clawhub.json` (JSON, бажано)
- `/.well-known/clawdhub.json` (застаріло)

Схема:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Якщо ви self-host, обслуговуйте цей файл (або явно задайте `CLAWHUB_REGISTRY`; застарілий `CLAWDHUB_REGISTRY`).
