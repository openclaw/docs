---
read_when:
    - Додавання/змінення кінцевих точок
    - Налагодження запитів CLI ↔ реєстру
summary: Довідник HTTP API (публічні кінцеві точки + кінцеві точки CLI + автентифікація).
x-i18n:
    generated_at: "2026-05-12T12:48:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

Базова URL-адреса: `https://clawhub.ai` (за замовчуванням).

Усі шляхи v1 розташовані під `/api/v1/...`.
Застарілі `/api/...` і `/api/cli/...` залишаються для сумісності (див. `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Повторне використання публічного каталогу

Сторонні каталоги можуть використовувати публічні кінцеві точки читання, щоб показувати список або шукати ClawHub skills. Кешуйте результати, дотримуйтеся `429`/`Retry-After`, спрямовуйте користувачів назад до канонічного запису ClawHub (`https://clawhub.ai/<owner>/<slug>`) і не створюйте враження, що ClawHub схвалює сторонній сайт. Не намагайтеся дзеркалити прихований, приватний або заблокований модерацією вміст поза публічною поверхнею API.

Скорочення web slug розв'язуються між сімействами реєстру, але клієнтам API слід використовувати
канонічні URL-адреси, повернені кінцевими точками читання, замість реконструювання пріоритету
маршрутів.

## Обмеження частоти

Модель застосування:

- Анонімні запити: застосовується для кожної IP-адреси.
- Автентифіковані запити (дійсний Bearer token): застосовується для користувацького кошика.
- Якщо token відсутній або недійсний, поведінка повертається до застосування за IP-адресою.
- Автентифіковані кінцеві точки запису не повинні повертати голе `Unauthorized`, коли
  сервер знає причину. Відсутні tokens, недійсні/відкликані tokens і
  видалені/забанені/вимкнені облікові записи мають отримувати дієвий текст, щоб CLI
  клієнти могли пояснити користувачам, що їх заблокувало.

- Читання: 600/хв на IP, 2400/хв на ключ
- Запис: 45/хв на IP, 180/хв на ключ
- Завантаження: 30/хв на IP, 180/хв на ключ (`/api/v1/download`)

Заголовки:

- Сумісність із застарілим API: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Стандартизовані: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- При `429`: `Retry-After`

Семантика заголовків:

- `X-RateLimit-Reset`: абсолютний час Unix epoch у секундах
- `RateLimit-Reset`: секунди до скидання (затримка)
- `Retry-After`: скільки секунд чекати перед повторною спробою (затримка) при `429`

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
- Використовуйте backoff із jitter, щоб уникнути синхронізованих повторних спроб.
- Якщо `Retry-After` відсутній, поверніться до `RateLimit-Reset` (або обчисліть із `X-RateLimit-Reset`).

Джерело IP:

- За замовчуванням використовує `cf-connecting-ip` (Cloudflare) для IP клієнта.
- ClawHub використовує довірені forwarding headers для ідентифікації IP-адрес клієнтів на edge.
- Якщо довірена IP-адреса клієнта недоступна, анонімні запити на завантаження використовують резервний кошик, обмежений кінцевою точкою, замість одного глобального кошика `ip:unknown`. Анонімні запити читання/запису все ще використовують спільний unknown bucket, щоб маршрутизація без IP залишалася видимою та консервативною.

## Публічні кінцеві точки (без автентифікації)

### `GET /api/v1/search`

Параметри запиту:

- `q` (обов'язково): рядок запиту
- `limit` (необов'язково): ціле число
- `highlightedOnly` (необов'язково): `true`, щоб фільтрувати лише highlighted skills
- `nonSuspiciousOnly` (необов'язково): `true`, щоб приховати підозрілі (`flagged.suspicious`) skills
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

- Результати повертаються в порядку релевантності (подібність embedding + підсилення точних token slug/name + попередня популярність за завантаженнями).
- Релевантність сильніша за популярність. Точний збіг slug або token display-name може випередити слабший збіг із набагато більшою кількістю завантажень.
- ASCII-текст токенізується за межами слів і пунктуації. Наприклад, `personal-map` містить окремий token `map`, тоді як `amap-jsapi-skill` містить `amap`, `jsapi` і `skill`; тому пошук `map` дає `personal-map` сильніший лексичний збіг, ніж `amap-jsapi-skill`.
- Завантаження використовуються як невеликий log-scaled prior і tie-breaker, а не як основний сигнал ранжування. Skills з великою кількістю завантажень можуть ранжуватися нижче, коли текст запиту має слабший збіг.
- Підозрілий або прихований стан модерації може вилучити skill із публічного пошуку залежно від фільтрів викликача та поточного статусу модерації.

Рекомендації щодо видимості для видавців:

- Розміщуйте терміни, які користувачі буквально шукатимуть, у display name, summary і tags. Використовуйте окремий slug token лише тоді, коли це також стабільна ідентичність, яку ви хочете зберегти.
- Не перейменовуйте slug лише заради одного запиту, якщо новий slug не є кращою довгостроковою канонічною назвою. Старі slugs стають redirect aliases, але канонічна URL-адреса, показаний slug і майбутні search digests використовують новий slug.
- Rename aliases зберігають розв'язання для старих URL-адрес і встановлень, які розв'язуються через реєстр, але ранжування пошуку базується на канонічних metadata skill після індексації перейменування. Наявна статистика залишається зі skill.
- Якщо skill несподівано невидимий, спершу перевірте стан модерації за допомогою `clawhub inspect <slug>` після входу, перш ніж змінювати metadata, пов'язані з ранжуванням.

### `GET /api/v1/skills`

Параметри запиту:

- `limit` (необов'язково): ціле число (1–200)
- `cursor` (необов'язково): pagination cursor для будь-якого сортування, окрім `trending`
- `sort` (необов'язково): `updated` (за замовчуванням), `createdAt` (псевдонім: `newest`), `downloads`, `stars` (псевдонім: `rating`), `installsCurrent` (псевдонім: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (необов'язково): `true`, щоб приховати підозрілі (`flagged.suspicious`) skills
- `nonSuspicious` (необов'язково): застарілий псевдонім для `nonSuspiciousOnly`

Примітки:

- `trending` ранжує за встановленнями за останні 7 днів (на основі telemetry).
- `createdAt` стабільний для сканування нових skills; `updated` змінюється, коли наявні skills публікуються повторно.
- Коли `nonSuspiciousOnly=true`, cursor-based sorts можуть повертати на сторінці менше ніж `limit` елементів, оскільки підозрілі skills фільтруються після отримання сторінки.
- Використовуйте `nextCursor`, щоб продовжити pagination, коли він присутній. Коротка сторінка сама по собі не означає кінець результатів.

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

- Старі slugs, створені потоками перейменування/злиття owner, розв'язуються до канонічного skill.
- `metadata.os`: обмеження OS, оголошені у frontmatter skill (наприклад, `["macos"]`, `["linux"]`). `null`, якщо не оголошено.
- `metadata.systems`: цільові системи Nix (наприклад, `["aarch64-darwin", "x86_64-linux"]`). `null`, якщо не оголошено.
- `metadata` дорівнює `null`, якщо skill не має metadata платформи.
- `moderation` включається лише тоді, коли skill позначено або його переглядає owner.

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

- Owners і moderators можуть отримувати доступ до подробиць модерації для прихованих skills.
- Публічні викликачі отримують `200` лише для вже позначених видимих skills.
- Evidence редагується для публічних викликачів і містить raw snippets лише для owners/moderators.

### `POST /api/v1/skills/{slug}/report`

Повідомити про skill для перегляду модератором. Звіти мають рівень skill, можуть бути пов'язані
з версією та потрапляють у чергу звітів про skill.

Автентифікація:

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

Кінцева точка moderator/admin для приймання звітів про skills.

Параметри запиту:

- `status` (необов'язково): `open` (за замовчуванням), `confirmed`, `dismissed` або `all`
- `limit` (необов'язково): ціле число (1-200)
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

Кінцева точка moderator/admin для розв'язання або повторного відкриття звітів про skills.

Запит:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` обов'язковий для `confirmed` і `dismissed`; його можна пропустити під час
встановлення `status` назад на `open`. Передайте `finalAction: "hide"` із triaged
report, щоб приховати skill у тому самому auditable workflow.

### `GET /api/v1/skills/{slug}/versions`

Параметри запиту:

- `limit` (необов'язково): ціле число
- `cursor` (необов'язково): pagination cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

Повертає metadata версії + список files.

- `version.security` містить нормалізований статус перевірки сканування й подробиці scanner
  (VirusTotal + LLM), коли доступно.

### `GET /api/v1/skills/{slug}/scan`

Повертає подробиці перевірки security scan для версії skill.

Параметри запиту:

- `version` (необов'язково): конкретний рядок версії.
- `tag` (необов'язково): розв'язати версію з tag (наприклад, `latest`).

Примітки:

- Якщо не надано ні `version`, ні `tag`, використовується остання версія.
- Містить нормалізований verification status плюс scanner-specific details.
- `security.capabilityTags` містить deterministic capability/risk labels, такі як
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` і `posts-externally`, коли виявлено.
- `security.hasScanResult` дорівнює `true` лише тоді, коли scanner створив definitive verdict (`clean`, `suspicious` або `malicious`).
- `moderation` — це поточний snapshot модерації на рівні skill, виведений з останньої версії.
- Під час запиту історичної версії перевіряйте `moderation.matchesRequestedVersion` і `moderation.sourceVersion`, перш ніж вважати `moderation` і `security` тим самим контекстом версії.

### `GET /api/v1/skills/{slug}/file`

Повертає raw text content.

Параметри запиту:

- `path` (обов'язково)
- `version` (необов'язково)
- `tag` (необов'язково)

Примітки:

- За замовчуванням використовується остання версія.
- Обмеження розміру файлу: 200KB.

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
- `executesCode` (необов’язково): `true` або `false`
- `capabilityTag` (необов’язково): фільтр можливостей для Plugin-пакетів
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
- Записи Skills і надалі підтримуються реєстром Skills та можуть публікуватися лише через `POST /api/v1/skills`.
- `POST /api/v1/packages` досі призначений лише для релізів code-plugin і bundle-plugin.
- Анонімні викликачі бачать лише публічні канали пакетів.
- Автентифіковані викликачі можуть бачити приватні пакети для видавців, до яких вони належать, у результатах списку/пошуку.
- `channel=private` повертає лише пакети, які автентифікований викликач може читати.

### `GET /api/v1/packages/search`

Уніфікований пошук у каталозі між Skills + Plugin-пакетами.

Параметри запиту:

- `q` (обов’язково): рядок запиту
- `limit` (необов’язково): ціле число (1–100)
- `family` (необов’язково): `skill`, `code-plugin` або `bundle-plugin`
- `channel` (необов’язково): `official`, `community` або `private`
- `isOfficial` (необов’язково): `true` або `false`
- `executesCode` (необов’язково): `true` або `false`
- `capabilityTag` (необов’язково): фільтр можливостей для Plugin-пакетів
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` і
  `osPermission` приймаються як скорочення для поширених тегів можливостей
- `artifactKind` (необов’язково): `legacy-zip` або `npm-pack`
- `npmMirror` (необов’язково): `true`/`1`, щоб шукати версії пакетів на базі ClawPack,
  доступні через npm-дзеркало

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

М’яко видаляє пакет і всі релізи.

Примітки:

- Потрібен API-токен власника пакета, власника/адміністратора org-видавця,
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
можливостями, перевіркою, метаданими артефактів і даними сканування.

Примітки:

- `version.artifact.kind` має значення `legacy-zip` для архівів пакетів старого світу або
  `npm-pack` для релізів на базі ClawPack.
- Релізи ClawPack містять npm-сумісні поля `npmIntegrity`, `npmShasum` і
  `npmTarballName`.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` і `version.staticScan` включаються, коли існують дані сканування.
- Приватні пакети повертають `404`, якщо викликач не може читати видавця-власника.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Повертає явні метадані розв’язувача артефакта для версії пакета.

Примітки:

- Версії застарілих пакетів повертають артефакт `legacy-zip` і застарілий ZIP
  `downloadUrl`.
- Версії ClawPack повертають артефакт `npm-pack`, поля цілісності npm,
  `tarballUrl` і URL сумісності із застарілим ZIP.
- Це поверхня розв’язувача OpenClaw; вона уникає вгадування формату архіву зі
  спільної URL-адреси.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Завантажує артефакт версії через явний шлях розв’язувача.

Примітки:

- Версії ClawPack транслюють точні байти завантаженого npm-pack `.tgz`.
- Версії застарілих ZIP перенаправляють до `/api/v1/packages/{name}/download?version=`.
- Використовує кошик лімітів швидкості для завантажень.

### `GET /api/v1/packages/{name}/readiness`

Повертає обчислену готовність для майбутнього споживання OpenClaw.

Перевірки готовності охоплюють:

- статус офіційного каналу
- доступність найновішої версії
- доступність артефакта ClawPack npm-pack
- дайджест артефакта
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

Ендпоінт модератора для переліку рядків міграції офіційних OpenClaw Plugin.

Автентифікація:

- Потрібен API-токен користувача-модератора або адміністратора.

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

Адміністративний ендпоінт для створення або оновлення рядка міграції офіційного Plugin.

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
- Це відстежує лише готовність міграції. Це не змінює OpenClaw і не генерує
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Ендпоінт модератора/адміністратора для черг перевірки релізів пакетів.

Автентифікація:

- Потрібен API-токен користувача-модератора або адміністратора.

Параметри запиту:

- `status` (необов’язково): `open` (типово), `blocked`, `manual` або `all`
- `limit` (необов’язково): ціле число (1-100)
- `cursor` (необов’язково): курсор пагінації

Значення статусів:

- `open`: підозрілі, шкідливі, очікувані, поміщені в карантин, відкликані або поскаржені релізи.
- `blocked`: поміщені в карантин, відкликані або шкідливі релізи.
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

Повідомляє про пакет для перевірки модератором. Скарги мають рівень пакета та можуть
необов’язково бути пов’язані з версією. Вони надходять до черги модерації, але самі по собі не приховують автоматично і не
блокують завантаження; модератори мають використовувати модерацію релізів, щоб
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

Ендпоінт модератора/адміністратора для приймання скарг на пакети.

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

Ендпоінт власника/модератора для видимості модерації пакета.

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

Ендпоінт модератора/адміністратора для вирішення або повторного відкриття скарг на пакети.

Запит:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` потрібен для `confirmed` і `dismissed`; його можна пропустити під час
повернення `status` до `open`. Передайте `finalAction: "quarantine"` або
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

Кінцева точка модератора/адміністратора для перевірки релізу пакета.

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

### `POST /api/v1/packages/backfill/artifacts`

Кінцева точка обслуговування лише для адміністратора для позначення старіших релізів пакетів
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

- За замовчуванням використовується пробний запуск.
- Релізи без сховища ClawPack позначаються як `legacy-zip`.
- Наявні рядки на основі ClawPack без `artifactKind` виправляються як
  `npm-pack`.
- Це не генерує ClawPack і не змінює байти артефактів.

### `GET /api/v1/packages/{name}/file`

Повертає необроблений текстовий вміст файлу пакета.

Параметри запиту:

- `path` (обов’язково)
- `version` (необов’язково)
- `tag` (необов’язково)

Примітки:

- За замовчуванням використовується останній реліз.
- Використовує кошик ліміту читання, а не кошик завантаження.
- Двійкові файли повертають `415`.
- Обмеження розміру файлу: 200KB.
- Очікувані сканування VirusTotal не блокують читання; шкідливі релізи все ще можуть утримуватися в іншому місці.
- Приватні пакети повертають `404`, якщо викликач не може читати власника-видавця.

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
  `X-ClawHub-Artifact-Sha256` для перевірок цілісності резолвера.
- Метадані лише реєстру не вставляються в завантажений архів.
- Очікувані сканування VirusTotal не блокують завантаження; шкідливі релізи повертають `403`.
- Приватні пакети повертають `404`, якщо викликач не є власником.

### `GET /api/npm/{package}`

Повертає npm-сумісний packument для версій пакетів на основі ClawPack.

Примітки:

- Перелічуються лише версії із завантаженими tarball ClawPack npm-pack.
- Застарілі версії лише з ZIP навмисно пропускаються.
- `dist.tarball`, `dist.integrity` і `dist.shasum` використовують npm-сумісні
  поля, щоб користувачі могли спрямувати npm на дзеркало, якщо захочуть.
- Packument для scoped-пакетів підтримують як `/api/npm/@scope/name`, так і npm
  закодований шлях запиту `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Транслює точні байти завантаженого tarball ClawPack для клієнтів npm-дзеркала.

Примітки:

- Використовує кошик ліміту завантаження.
- Заголовки завантаження містять SHA-256 ClawHub плюс метадані npm integrity/shasum.
- Модерація та перевірки доступу до приватних пакетів усе ще застосовуються.

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

- Якщо не надано ні `version`, ні `tag`, використовується остання версія.
- Soft-deleted версії повертають `410`.
- Статистика завантажень рахується як унікальні ідентичності за годину (`userId`, коли API-токен чинний, інакше IP).

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
- JSON-тіло з `files` (на основі storageId) також приймається.
- Необов’язкове поле payload: `ownerHandle`. Якщо присутнє, API розв’язує цього
  видавця на боці сервера й вимагає, щоб актор мав доступ до видавця.
- Необов’язкове поле payload: `migrateOwner`. Коли `true` з `ownerHandle`, наявний
  skill може перейти до цього власника, якщо актор є адміністратором/власником у поточного
  й цільового видавців. Без цієї явної згоди зміни власника
  відхиляються.

### `POST /api/v1/packages`

Публікує реліз code-plugin або bundle-plugin.

- Потребує автентифікації Bearer token.
- Бажано: `multipart/form-data` з JSON `payload` + blob `files[]`.
- JSON-тіло з `files` (на основі storageId) також приймається.
- Необов’язкове поле payload: `ownerHandle`. Якщо присутнє, лише адміністратори можуть публікувати від імені цього власника.

Ключові моменти валідації:

- `family` має бути `code-plugin` або `bundle-plugin`.
- Пакети Plugin потребують `openclaw.plugin.json`. Завантаження ClawPack `.tgz` мають
  містити його в `package/openclaw.plugin.json`.
- Code plugins потребують `package.json`, метаданих репозиторію джерела, метаданих коміту джерела,
  метаданих схеми конфігурації, `openclaw.compat.pluginApi` і
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` і `openclaw.environment` є необов’язковими метаданими.
- Лише довірені видавці можуть публікувати в канал `official`.
- Публікації від імені іншого користувача все одно перевіряють право на official-channel щодо цільового облікового запису власника.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Soft-delete / відновлення skill (власник, модератор або адміністратор).

Необов’язкове JSON-тіло:

```json
{ "reason": "Held for moderation pending legal review." }
```

Якщо присутній, `reason` зберігається як примітка модерації skill і копіюється в журнал аудиту.
Soft deletes, ініційовані власником, резервують slug на 30 днів, після чого slug може бути заявлений
іншим видавцем. Відповідь видалення містить `slugReservedUntil`, коли застосовується цей строк дії.
Приховування модератором/адміністратором і видалення з міркувань безпеки так не спливають.

Відповідь видалення:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Коди стану:

- `200`: ok
- `401`: unauthorized
- `403`: forbidden
- `404`: skill/користувача не знайдено
- `500`: внутрішня помилка сервера

### `POST /api/v1/users/publisher`

Лише для адміністратора. Гарантує, що для handle існує org-видавець. Якщо handle все ще вказує на
застарілого спільного користувача/персонального видавця, кінцева точка спочатку мігрує його в org-видавця.

- Тіло: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Відповідь: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Лише для адміністратора. Резервує кореневі slug і назви пакетів для законного власника без публікації
релізу. Назви пакетів стають приватними пакетами-заповнювачами без рядків релізів, тому той самий
власник згодом може опублікувати справжній реліз code-plugin або bundle-plugin під цією назвою.

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

- Обидві кінцеві точки потребують автентифікації API-токеном і працюють лише для власника skill.
- `rename` зберігає попередній slug як alias перенаправлення.
- `merge` приховує вихідний запис і перенаправляє вихідний slug на цільовий запис.

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

Банить користувача й остаточно видаляє належні йому skills (лише модератор/адміністратор).

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

Знімає бан з користувача й відновлює придатні skills (лише адміністратор).

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

Перелічує або шукає користувачів (лише адміністратор).

Параметри запиту:

- `q` (необов’язково): пошуковий запит
- `query` (необов’язково): alias для `q`
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

Додає/видаляє зірку (виділення). Обидві кінцеві точки ідемпотентні.

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

Якщо ви self-host, обслуговуйте цей файл (або явно задайте `CLAWHUB_REGISTRY`; застаріле `CLAWDHUB_REGISTRY`).
