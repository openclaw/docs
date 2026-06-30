---
read_when:
    - Добавление/изменение конечных точек
    - Отладка запросов CLI ↔ реестра
summary: Справочник HTTP API (публичные конечные точки, конечные точки CLI и аутентификация).
x-i18n:
    generated_at: "2026-06-30T22:26:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

Базовый URL: `https://clawhub.ai` (по умолчанию).

Все пути v1 находятся в `/api/v1/...`.
Устаревшие `/api/...` и `/api/cli/...` сохраняются для совместимости (см. `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Повторное использование публичного каталога

Сторонние каталоги могут использовать публичные конечные точки чтения, чтобы выводить список или искать Skills ClawHub. Кэшируйте результаты, учитывайте `429`/`Retry-After`, направляйте пользователей обратно к канонической странице ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) и не создавайте впечатление, что ClawHub одобряет сторонний сайт. Не пытайтесь зеркалировать скрытый, приватный или заблокированный модерацией контент за пределами публичной поверхности API.

Сокращения веб-слагов разрешаются между семействами реестра, но клиенты API должны использовать
канонические URL, возвращаемые конечными точками чтения, вместо самостоятельного восстановления
приоритета маршрутов.

## Ограничения частоты

Модель применения:

- Анонимные запросы: применяются на IP.
- Аутентифицированные запросы (действительный Bearer token): применяются на пользовательскую корзину.
- Если токен отсутствует или недействителен, поведение возвращается к ограничению по IP.
- Аутентифицированные конечные точки записи не должны возвращать простой `Unauthorized`, когда
  сервер знает причину. Отсутствующие токены, недействительные/отозванные токены и
  удаленные/заблокированные/отключенные учетные записи должны получать действенный текст, чтобы CLI
  клиенты могли сообщить пользователям, что именно их заблокировало.

- Чтение: 3000/мин на IP, 12000/мин на ключ
- Запись: 300/мин на IP, 3000/мин на ключ
- Скачивание: 1200/мин на IP, 6000/мин на ключ (конечные точки скачивания)

Заголовки:

- Устаревшая совместимость: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Стандартизированные: `RateLimit-Limit`, `RateLimit-Reset`
- При `429`: `X-RateLimit-Remaining: 0` и `RateLimit-Remaining: 0`
- При `429`: `Retry-After`

Семантика заголовков:

- `X-RateLimit-Reset`: абсолютное время Unix epoch в секундах
- `RateLimit-Reset`: секунды до сброса (задержка)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: точный оставшийся бюджет, если присутствует.
  Успешные шардированные запросы опускают этот заголовок вместо возврата приблизительного глобального значения.
- `Retry-After`: сколько секунд ждать перед повторной попыткой (задержка) при `429`

Пример ответа `429`:

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

Рекомендации для клиентов:

- Если есть `Retry-After`, подождите указанное число секунд перед повторной попыткой.
- Используйте backoff с jitter, чтобы избежать синхронных повторных попыток.
- Если `Retry-After` отсутствует, используйте `RateLimit-Reset` (или вычислите из `X-RateLimit-Reset`).

Источник IP:

- Использует доверенные заголовки IP клиента, включая `cf-connecting-ip`, только когда
  развертывание явно включает доверенные пересланные заголовки.
- ClawHub использует доверенные заголовки пересылки для определения IP клиентов на edge.
- Если доверенный IP клиента недоступен, анонимные запросы используют резервные корзины,
  ограниченные только видом rate-limit. Эти резервные корзины не включают
  предоставленные вызывающим пути, слаги, имена пакетов, версии, строки запроса или другие
  параметры артефактов.

## Ответы с ошибками

Публичные ответы об ошибках v1 являются простым текстом с `content-type: text/plain; charset=utf-8`.
Это включает ошибки валидации (`400`), отсутствующие публичные ресурсы (`404`), ошибки аутентификации и
разрешений (`401`/`403`), ограничения частоты (`429`) и заблокированные скачивания. Клиенты
должны читать тело ответа как удобочитаемую строку. Неизвестные параметры запроса
игнорируются для совместимости, но распознанные параметры запроса с недопустимыми значениями возвращают
`400`.

## Публичные конечные точки (без аутентификации)

### `GET /api/v1/search`

Параметры запроса:

- `q` (обязательно): строка запроса
- `limit` (необязательно): целое число
- `highlightedOnly` (необязательно): `true`, чтобы отфильтровать только выделенные навыки
- `nonSuspiciousOnly` (необязательно): `true`, чтобы скрыть подозрительные (`flagged.suspicious`) навыки
- `nonSuspicious` (необязательно): устаревший псевдоним для `nonSuspiciousOnly`

Ответ:

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

Примечания:

- Результаты возвращаются в порядке релевантности (сходство embedding + усиление точных токенов слага/имени + небольшой prior популярности).
- Релевантность важнее популярности. Точное совпадение токена слага или отображаемого имени может ранжироваться выше более свободного совпадения с гораздо более сильной вовлеченностью.
- ASCII-текст токенизируется по границам слов и пунктуации. Например, `personal-map` содержит отдельный токен `map`, тогда как `amap-jsapi-skill` содержит `amap`, `jsapi` и `skill`; поэтому поиск `map` дает `personal-map` более сильное лексическое совпадение, чем `amap-jsapi-skill`.
- Популярность логарифмически масштабируется и ограничивается. Навыки с высокой вовлеченностью могут ранжироваться ниже, если текст запроса совпадает слабее.
- Подозрительное или скрытое состояние модерации может удалить навык из публичного поиска в зависимости от фильтров вызывающего и текущего статуса модерации.

Рекомендации по обнаруживаемости для издателей:

- Помещайте термины, которые пользователи будут буквально искать, в отображаемое имя, сводку и теги. Используйте отдельный токен слага только тогда, когда он также является стабильной идентичностью, которую вы хотите сохранить.
- Не переименовывайте слаг только ради одного запроса, если новый слаг не является лучшим долгосрочным каноническим именем. Старые слаги становятся псевдонимами перенаправления, но канонический URL, отображаемый слаг и будущие поисковые дайджесты используют новый слаг.
- Псевдонимы переименования сохраняют разрешение для старых URL и установок, которые разрешаются через реестр, но ранжирование поиска основано на канонических метаданных навыка после индексации переименования. Существующая статистика остается с навыком.
- Если навык неожиданно невидим, сначала проверьте состояние модерации с помощью `clawhub inspect @owner/slug`, войдя в систему, прежде чем изменять метаданные, связанные с ранжированием.

### `GET /api/v1/skills`

Параметры запроса:

- `limit` (необязательно): целое число (1–200)
- `cursor` (необязательно): курсор пагинации для любой сортировки, кроме `trending`
- `sort` (необязательно): `updated` (по умолчанию), `recommended` (псевдоним: `default`), `createdAt` (псевдоним: `newest`), `downloads`, `stars` (псевдоним: `rating`), устаревшие псевдонимы установок `installsCurrent`/`installs`/`installsAllTime` сопоставляются с `downloads`, `trending`
- `nonSuspiciousOnly` (необязательно): `true`, чтобы скрыть подозрительные (`flagged.suspicious`) навыки
- `nonSuspicious` (необязательно): устаревший псевдоним для `nonSuspiciousOnly`

Недопустимые значения `sort` возвращают `400`.

Примечания:

- `recommended` использует сигналы вовлеченности и давности.
- `trending` ранжирует по установкам за последние 7 дней (на основе телеметрии).
- `createdAt` стабилен для обходов новых навыков; `updated` меняется, когда существующие навыки публикуются заново.
- Когда `nonSuspiciousOnly=true`, сортировки на основе курсора могут возвращать меньше элементов, чем `limit`, на странице, потому что подозрительные навыки фильтруются после получения страницы.
- Используйте `nextCursor`, чтобы продолжить пагинацию, если он присутствует. Короткая страница сама по себе не означает конец результатов.

Ответ:

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

Ответ:

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

Примечания:

- Старые слаги, созданные потоками переименования/слияния владельца, разрешаются в канонический навык.
- `metadata.os`: ограничения ОС, объявленные во frontmatter навыка (например, `["macos"]`, `["linux"]`). `null`, если не объявлено.
- `metadata.systems`: целевые системы Nix (например, `["aarch64-darwin", "x86_64-linux"]`). `null`, если не объявлено.
- `metadata` равен `null`, если у навыка нет метаданных платформы.
- `moderation` включается только когда навык помечен или его просматривает владелец.

### `GET /api/v1/skills/{slug}/moderation`

Возвращает структурированное состояние модерации.

Ответ:

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

Примечания:

- Владельцы и модераторы могут получать доступ к деталям модерации для скрытых навыков.
- Публичные вызывающие получают `200` только для уже помеченных видимых навыков.
- Доказательства редактируются для публичных вызывающих и включают сырые фрагменты только для владельцев/модераторов.

### `POST /api/v1/skills/{slug}/report`

Пожаловаться на навык для проверки модератором. Жалобы относятся к уровню навыка, необязательно связаны
с версией и попадают в очередь жалоб на навыки.

Аутентификация:

- Требуется API-токен.

Запрос:

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
```

Ответ:

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

Конечная точка модератора/администратора для приема жалоб на навыки.

Параметры запроса:

- `status` (необязательно): `open` (по умолчанию), `confirmed`, `dismissed` или `all`
- `limit` (необязательно): целое число (1-200)
- `cursor` (необязательно): курсор пагинации

Ответ:

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

Конечная точка модератора/администратора для разрешения или повторного открытия жалоб на навыки.

Запрос:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` требуется для `confirmed` и `dismissed`; его можно опустить при
возврате `status` к `open`. Передайте `finalAction: "hide"` с обработанной
жалобой, чтобы скрыть навык в том же аудируемом workflow.

### `GET /api/v1/skills/{slug}/versions`

Параметры запроса:

- `limit` (необязательно): целое число
- `cursor` (необязательно): курсор пагинации

### `GET /api/v1/skills/{slug}/versions/{version}`

Возвращает метаданные версии + список файлов.

- `version.security` включает нормализованный статус проверки сканирования и сведения о сканере
  (VirusTotal + LLM), когда они доступны.

### `GET /api/v1/skills/{slug}/scan`

Возвращает сведения о проверке сканирования безопасности для версии навыка.

Параметры запроса:

- `version` (необязательно): строка конкретной версии.
- `tag` (необязательно): разрешить версию с тегом (например, `latest`).

Примечания:

- Если не указаны ни `version`, ни `tag`, используется последняя версия.
- Включает нормализованный статус проверки и сведения, специфичные для сканера.
- `security.hasScanResult` равно `true` только когда сканер выдал окончательный вердикт (`clean`, `suspicious` или `malicious`).
- `moderation` — это текущий снимок модерации на уровне навыка, полученный из последней версии.
- При запросе исторической версии проверьте `moderation.matchesRequestedVersion` и `moderation.sourceVersion`, прежде чем считать `moderation` и `security` относящимися к одному и тому же контексту версии.

### `POST /api/v1/skills/-/scan`

Аутентифицированный endpoint отправки новых заданий ClawScan.

Сканирование локальных загрузок больше не поддерживается. Запросы с
`multipart/form-data` или `{ "source": { "kind": "upload" } }` возвращают `410`.

Сканирования опубликованных версий используют JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Примечания:

- Полезные нагрузки запросов сканирования и загружаемые отчеты удаляются из хранилища scan-request после окна хранения.
- Сканирования опубликованных версий требуют управленческого доступа владельца/издателя либо полномочий модератора/администратора платформы.
- Сканирования опубликованных версий выполняют обратную запись только когда `update: true` и сканирование успешно завершается.
- Ответ — `202` с `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Задания сканирования асинхронны. Ручные запросы сканирования получают приоритет перед обычной работой публикации/обратного заполнения, но завершение все равно зависит от доступности воркеров.

### `GET /api/v1/skills/-/scan/{scanId}`

Аутентифицированный endpoint опроса отправленного сканирования.

- Возвращает статус queued/running/succeeded/failed.
- Возвращает `queue.queuedAhead` и `queue.position`, пока задание находится в очереди, чтобы клиенты могли показать, сколько приоритетных ручных сканирований находится впереди запроса. Очень большие очереди ограничиваются и передаются с `queuedAheadIsEstimate: true`.
- При наличии `report` содержит разделы `clawscan`, `skillspector`, `staticAnalysis` и `virustotal`.
- Неудачные задания сканирования возвращают `status: "failed"` с `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Аутентифицированный endpoint архива отчета.

- Требует успешно завершенного сканирования; незавершенные сканирования возвращают `409`.
- Возвращает ZIP с `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` и `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Аутентифицированный endpoint сохраненного архива отчета для отправленных версий.

- Требует управленческого доступа владельца/издателя к навыку или Plugin либо полномочий модератора/администратора платформы.
- Возвращает сохраненные результаты сканирования для точной отправленной версии, включая заблокированные или скрытые версии.
- `kind` по умолчанию равен `skill`; используйте `kind=plugin` для сканирований Plugin/пакетов.
- Возвращает ту же структуру ZIP, что и загрузки scan-request.

### `POST /api/v1/skills/-/scan/batch`

Канонический маршрут пакетного повторного сканирования только для администраторов. Он принимает ту же форму полезной нагрузки, что и устаревший `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Канонический маршрут статуса пакетного задания только для администраторов. Он принимает `{ "jobIds": ["..."] }` и возвращает те же агрегированные счетчики, что и устаревший `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Возвращает конверт проверки Skill Card, используемый `clawhub skill verify`.

Параметры запроса:

- `version` (необязательно): строка конкретной версии.
- `tag` (необязательно): разрешить версию по тегу (например, `latest`).

Примечания:

- `ok` равно `true` только когда для выбранной версии сгенерирована Skill Card, она не заблокирована модерацией как вредоносная, а проверка ClawScan чистая.
- Идентичность навыка, идентичность издателя и метаданные выбранной версии являются полями верхнего уровня конверта (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), чтобы shell-автоматизация могла читать их без распаковки вложенных оберток.
- `security` — это вердикт ClawScan/security верхнего уровня. Автоматизации следует ориентироваться на `ok`, `decision`, `reasons` и `security.status`.
- `security.signals` содержит подтверждающие данные сканеров, такие как `staticScan`, `virusTotal` и `skillSpector`.
- `security.signals.dependencyRegistry` сохранен для совместимости ответа v1, но сканер существования реестра зависимостей выведен из эксплуатации, и этот ключ всегда равен `null`.
- `provenance` равно `server-resolved-github-import` только когда ClawHub разрешил и сохранил репозиторий/ref/commit/path GitHub во время публикации или импорта; в остальных случаях это `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Возвращает текущие компактные вердикты безопасности для точных версий навыков. Этот
endpoint коллекции предназначен для клиентов, которые уже знают, какие установленные
версии навыков ClawHub им нужно отобразить, например OpenClaw Control UI.

Запрос:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Примечания:

- `items` должен содержать 1-100 уникальных пар `{ slug, version }`.
- Результаты возвращаются по каждому элементу; один отсутствующий навык или версия не приводит к ошибке всего ответа.
- Ответ содержит только данные безопасности. Он не включает данные Skill Card, статус сгенерированной карточки, списки файлов артефактов или подробные полезные нагрузки сканеров.
- `security.signals` содержит только подтверждающие данные уровня статуса; используйте `/scan` или страницу security-audit ClawHub для полных сведений сканеров.
- `security.signals.dependencyRegistry` сохранен для совместимости ответа v1, но сканер существования реестра зависимостей выведен из эксплуатации, и этот ключ всегда равен `null`.
- Отсутствие Skill Card не влияет на `ok`, `decision` или `reasons` этого endpoint; клиенты должны читать установленный `skill-card.md` локально, когда им нужно содержимое карточки.
- Используйте `/verify`, когда нужен конверт проверки Skill Card для одного навыка, `/card`, когда нужен сгенерированный Markdown карточки, и `/scan`, когда нужны подробные данные сканеров.

Ответ:

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

Возвращает необработанное текстовое содержимое.

Параметры запроса:

- `path` (обязательный)
- `version` (необязательный)
- `tag` (необязательный)

Примечания:

- По умолчанию используется последняя версия.
- Ограничение размера файла: 200 КБ.

### `GET /api/v1/packages`

Единая конечная точка каталога для:

- skills
- code plugins
- bundle plugins

Параметры запроса:

- `limit` (необязательный): целое число (1–100)
- `cursor` (необязательный): курсор пагинации
- `family` (необязательный): `skill`, `code-plugin` или `bundle-plugin`
- `channel` (необязательный): `official`, `community` или `private`
- `isOfficial` (необязательный): `true` или `false`
- `sort` (необязательный): `updated` (по умолчанию), `recommended`, `trending`, `downloads`, устаревший псевдоним `installs`
- `category` (необязательный): фильтр категории plugin. Поддерживается только когда
  запрос ограничен пакетами plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` или конечными точками пакетов с
  `family=code-plugin`/`family=bundle-plugin`). Управляемые категории и
  устаревшие псевдонимы фильтров v1 описаны в `GET /api/v1/plugins`.

Примечания:

- Недопустимые значения для `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` или `sort` возвращают `400`. Неизвестные параметры запроса игнорируются.
- `GET /api/v1/code-plugins` и `GET /api/v1/bundle-plugins` остаются псевдонимами с фиксированным семейством.
- Записи Skills по-прежнему основаны на реестре Skills и все еще могут публиковаться только через `POST /api/v1/skills`.
- `POST /api/v1/packages` по-прежнему предназначен только для релизов code-plugin и bundle-plugin.
- Анонимные вызывающие стороны видят только публичные каналы пакетов.
- Аутентифицированные вызывающие стороны могут видеть приватные пакеты издателей, к которым они принадлежат, в результатах списка/поиска.
- `channel=private` возвращает только пакеты, которые аутентифицированная вызывающая сторона может читать.

### `GET /api/v1/packages/search`

Единый поиск по каталогу среди Skills и пакетов plugin.

Параметры запроса:

- `q` (обязательный): строка запроса
- `limit` (необязательный): целое число (1–100)
- `family` (необязательный): `skill`, `code-plugin` или `bundle-plugin`
- `channel` (необязательный): `official`, `community` или `private`
- `isOfficial` (необязательный): `true` или `false`
- `category` (необязательный): фильтр категории plugin. Поддерживается только когда
  запрос ограничен пакетами plugin. Управляемые категории и устаревшие псевдонимы
  фильтров v1 описаны в `GET /api/v1/plugins`.

Примечания:

- Недопустимые значения для `family`, `channel`, `isOfficial`, `featured` или
  `highlightedOnly` возвращают `400`. Неизвестные параметры запроса игнорируются.
- Анонимные вызывающие стороны видят только публичные каналы пакетов.
- Аутентифицированные вызывающие стороны могут искать приватные пакеты издателей, к которым они принадлежат.
- `channel=private` возвращает только пакеты, которые аутентифицированная вызывающая сторона может читать.

### `GET /api/v1/plugins`

Просмотр каталога только Plugin среди пакетов code-plugin и bundle-plugin.

Параметры запроса:

- `limit` (необязательный): целое число (1-100)
- `cursor` (необязательный): курсор пагинации
- `isOfficial` (необязательный): `true` или `false`
- `sort` (необязательный): `recommended` (по умолчанию), `trending`, `downloads`, `updated`, устаревший псевдоним `installs`
- `category` (необязательный): фильтр категории plugin. Текущие значения:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Устаревшие псевдонимы фильтров v1 по-прежнему принимаются на конечных точках чтения:

- `mcp-tooling`, `data` и `automation` преобразуются в `tools`.
- `observability` и `deployment` преобразуются в `gateway`.
- `dev-tools` преобразуется в `runtime`.

`trending` — это лидерборд установок/загрузок за семь дней, который не использует суммарные показатели за все время.
На единой конечной точке `/api/v1/packages` он применяется только к plugin; используйте
`/api/v1/skills?sort=trending` для каталога Skills.

Устаревшие псевдонимы не принимаются как сохраненные или объявленные автором значения категорий.

### `GET /api/v1/skills/export`

Массовый экспорт последних публичных Skills для офлайн-анализа.

Аутентификация:

- Требуется API-токен.

Параметры запроса:

- `startDate` (обязательный): нижняя граница в миллисекундах Unix для `updatedAt` Skills.
- `endDate` (обязательный): верхняя граница в миллисекундах Unix для `updatedAt` Skills.
- `limit` (необязательный): целое число (1-250), по умолчанию `250`.
- `cursor` (необязательный): курсор пагинации из предыдущего ответа.

Ответ:

- Тело: ZIP-архив.
- Каждый экспортированный Skill находится в корне `{publisher}/{slug}/`.
- Размещенные Skills включают файлы последней сохраненной версии и перечислены в
  `_manifest.json` с `sourceRef: "public-clawhub"`.
- Текущие Skills на базе GitHub со сканированием `clean` или `suspicious` включают
  `_source_handoff.json` с `sourceRef: "public-github"`, репозиторием, коммитом, путем,
  хешем содержимого и URL архива. Они не включают исходные файлы, размещенные в ClawHub.
- Каждый Skill включает `_export_skill_meta.json`.
- `_manifest.json` всегда включается в корень ZIP.
- `_errors.json` включается, когда отдельные Skills или файлы не удалось
  экспортировать.

Заголовки:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Массовый экспорт последних публичных релизов plugin для офлайн-анализа.

Аутентификация:

- Требуется API-токен.

Параметры запроса:

- `startDate` (обязательный): нижняя граница Unix в миллисекундах для `updatedAt` plugin.
- `endDate` (обязательный): верхняя граница Unix в миллисекундах для `updatedAt` plugin.
- `limit` (необязательный): целое число (1-250), по умолчанию `250`.
- `cursor` (необязательный): курсор пагинации из предыдущего ответа.
- `family` (необязательный): `code-plugin` или `bundle-plugin`. Если опущен, используются оба
  семейства plugin.

Ответ:

- Тело: ZIP-архив.
- Каждый экспортированный plugin находится в корне `{family}/{packageName}/`.
- Каждый экспортированный plugin включает сохраненные файлы последнего релиза.
- Метаданные экспорта для каждого plugin хранятся в
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` всегда включается в корень ZIP.
- `_errors.json` включается, когда отдельные plugins или файлы не удалось
  экспортировать.

Заголовки:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Поиск только по plugin среди пакетов code-plugin и bundle-plugin.

Параметры запроса:

- `q` (обязательный): строка запроса
- `limit` (необязательный): целое число (1-100)
- `isOfficial` (необязательный): `true` или `false`
- `category` (необязательный): фильтр категории plugin. Текущие значения:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Примечания:

- Устаревшие псевдонимы фильтров v1, задокументированные в `GET /api/v1/plugins`, также
  принимаются.
- Фильтрация по категории — это настоящий API-фильтр, основанный на строках дайджеста категорий plugin,
  а не переписывание поискового запроса.
- Результаты возвращаются в порядке релевантности и сейчас не поддерживают пагинацию.
- Элементы управления сортировкой в браузерном UI для поиска plugin переупорядочивают загруженные результаты по релевантности,
  совпадая с текущим поведением просмотра `/skills`.

### `GET /api/v1/packages/{name}`

Возвращает подробные метаданные пакета.

Примечания:

- Skills также могут разрешаться через этот маршрут в едином каталоге.
- Приватные пакеты возвращают `404`, если вызывающая сторона не может читать владеющего издателя.

### `DELETE /api/v1/packages/{name}`

Выполняет мягкое удаление пакета и всех релизов.

Примечания:

- Требует API-токен владельца пакета, владельца/администратора издателя-организации,
  модератора платформы или администратора платформы.

### `GET /api/v1/packages/{name}/versions`

Возвращает историю версий.

Параметры запроса:

- `limit` (необязательный): целое число (1–100)
- `cursor` (необязательный): курсор пагинации

Примечания:

- Приватные пакеты возвращают `404`, если вызывающая сторона не может читать владеющего издателя.

### `GET /api/v1/packages/{name}/versions/{version}`

Возвращает одну версию пакета, включая метаданные файлов, совместимость,
верификацию, метаданные артефакта и данные сканирования.

Примечания:

- `version.artifact.kind` имеет значение `legacy-zip` для архивов пакетов старого формата или
  `npm-pack` для релизов на основе ClawPack.
- Релизы ClawPack включают npm-совместимые поля `npmIntegrity`, `npmShasum` и
  `npmTarballName`.
- `version.sha256hash` — устаревшие метаданные совместимости для старых клиентов. Они
  хешируют точные байты ZIP, возвращаемые `/api/v1/packages/{name}/download`.
  Современным клиентам следует использовать `version.artifact.sha256`, который идентифицирует
  канонический артефакт релиза.
- `version.vtAnalysis`, `version.llmAnalysis` и `version.staticScan` включаются,
  когда существуют данные сканирования.
- Приватные пакеты возвращают `404`, если вызывающая сторона не может читать владеющего издателя.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Возвращает точную сводку безопасности и доверия для релиза пакета для клиентов
установки. Это публичная поверхность потребления OpenClaw для решения о том, можно ли
установить разрешенный релиз.

Аутентификация:

- Публичная конечная точка для чтения. Токен владельца, издателя, модератора или администратора
  не требуется.

Ответ:

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

Поля ответа:

- `package.name`, `package.displayName` и `package.family` идентифицируют
  разрешенный пакет реестра.
- `release.releaseId`, `release.version` и `release.createdAt` идентифицируют
  точный релиз, который был оценен.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` и `release.npmTarballName` присутствуют, когда известны для
  артефакта релиза.
- `trust.scanStatus` — эффективный статус доверия, полученный из входных данных сканеров
  и ручной модерации релиза.
- `trust.moderationState` допускает `null`. Он равен `null`, когда ручная модерация релиза
  отсутствует.
- `trust.blockedFromDownload` — сигнал блокировки установки. OpenClaw и другие
  клиенты установки должны блокировать установку, когда это значение равно `true`, вместо
  повторного вывода правил блокировки из полей сканера или модерации.
- `trust.reasons` — список объяснений для пользователя и аудита. Коды причин
  являются стабильными компактными строками, такими как `manual:quarantined`, `scan:malicious`
  и `package:malicious`.
- `trust.pending` означает, что один или несколько входных сигналов доверия все еще ожидают завершения.
- `trust.stale` означает, что сводка доверия была вычислена из устаревших входных данных и
  должна рассматриваться как требующая обновления перед высокоуверенным разрешающим решением.

Примечания:

- Эта конечная точка точна до версии. Клиенты должны вызывать ее после разрешения
  версии пакета, которую они намерены установить, а не только после чтения последних
  метаданных пакета.
- Приватные пакеты возвращают `404`, если вызывающая сторона не может читать владеющего издателя.
- Эта конечная точка намеренно уже, чем конечные точки модерации для владельцев/модераторов.
  Она раскрывает решение об установке и публичное объяснение, а не личности
  отправителей жалоб, тексты жалоб, приватные доказательства или внутренние временные шкалы
  проверки.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Возвращает явные метаданные resolver артефакта для версии пакета.

Примечания:

- Устаревшие версии пакетов возвращают артефакт `legacy-zip` и устаревший ZIP
  `downloadUrl`.
- Версии ClawPack возвращают артефакт `npm-pack`, поля целостности npm,
  `tarballUrl` и устаревший URL совместимости ZIP.
- Это поверхность resolver OpenClaw; она избегает угадывания формата архива по
  общему URL.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Загружает артефакт версии через явный путь resolver.

Примечания:

- Версии ClawPack передают потоком точные байты загруженного npm-pack `.tgz`.
- Устаревшие ZIP-версии перенаправляют на `/api/v1/packages/{name}/download?version=`.
- Использует корзину лимитов скорости загрузки.

### `GET /api/v1/packages/{name}/readiness`

Возвращает вычисленную готовность для будущего потребления OpenClaw.

Проверки готовности охватывают:

- статус официального канала
- доступность последней версии
- доступность артефакта ClawPack npm-pack
- дайджест артефакта
- источник репозитория и происхождение коммита
- метаданные совместимости OpenClaw
- целевые хосты
- состояние сканирования

Ответ:

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

Конечная точка модератора для списка строк миграции официальных plugin OpenClaw.

Аутентификация:

- Требует API-токен пользователя-модератора или администратора.

Параметры запроса:

- `phase` (необязательный): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` или
  `all` (по умолчанию).
- `limit` (необязательный): целое число (1-100)
- `cursor` (необязательный): курсор пагинации

Ответ:

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

Административная конечная точка для создания или обновления строки миграции официального plugin.

Аутентификация:

- Требует API-токен пользователя-администратора.

Тело запроса:

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

Примечания:

- `bundledPluginId` нормализуется к нижнему регистру и является стабильным ключом upsert.
- `packageName` нормализуется как имя npm; пакет может отсутствовать для запланированных
  миграций.
- Это отслеживает только готовность миграции. Это не изменяет OpenClaw и не генерирует
  ClawPack.

### `GET /api/v1/packages/moderation/queue`

Конечная точка модератора/администратора для очередей проверки релизов пакетов.

Аутентификация:

- Требует API-токен пользователя-модератора или администратора.

Параметры запроса:

- `status` (необязательный): `open` (по умолчанию), `blocked`, `manual` или `all`
- `limit` (необязательный): целое число (1-100)
- `cursor` (необязательный): курсор пагинации

Значения статуса:

- `open`: подозрительные, вредоносные, ожидающие, помещенные в карантин, отозванные релизы или релизы с жалобами.
- `blocked`: помещенные в карантин, отозванные или вредоносные релизы.
- `manual`: любой релиз с ручным переопределением модерации.
- `all`: любой релиз с ручным переопределением, не-чистым состоянием сканирования или жалобой на пакет.

Ответ:

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

Сообщает о пакете для проверки модератором. Жалобы относятся к уровню пакета, необязательно
связаны с версией. Они попадают в очередь модерации, но сами по себе не скрывают автоматически и
не блокируют загрузки; модераторам следует использовать модерацию релизов, чтобы
одобрять, помещать в карантин или отзывать артефакты.

Аутентификация:

- Требует API-токен.

Запрос:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

Ответ:

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

Эндпоинт модератора/администратора для приема отчетов о пакетах.

Аутентификация:

- Требует API-токен пользователя-модератора или администратора.

Параметры запроса:

- `status` (необязательно): `open` (по умолчанию), `confirmed`, `dismissed` или `all`
- `limit` (необязательно): целое число (1-100)
- `cursor` (необязательно): курсор пагинации

Ответ:

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

Эндпоинт владельца/модератора для видимости модерации пакета.

Аутентификация:

- Требует API-токен владельца пакета, участника издателя, модератора или
  администратора.

Ответ:

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

Эндпоинт модератора/администратора для разрешения или повторного открытия отчетов о пакетах.

Запрос:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` обязателен для `confirmed` и `dismissed`; его можно опустить при
возврате `status` в `open`. Передайте `finalAction: "quarantine"` или
`finalAction: "revoke"` с подтвержденным отчетом, чтобы применить модерацию релиза в
том же аудируемом рабочем процессе.

Ответ:

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

Эндпоинт модератора/администратора для проверки релиза пакета.

Запрос:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Поддерживаемые состояния:

- `approved`: вручную проверено и разрешено.
- `quarantined`: заблокировано до дальнейшей проверки.
- `revoked`: заблокировано после того, как релиз ранее считался доверенным.

Помещенные в карантин и отозванные релизы возвращают `403` из маршрутов скачивания артефактов.
Каждое изменение записывает запись в журнал аудита.

### `GET /api/v1/packages/{name}/file`

Возвращает необработанное текстовое содержимое файла пакета.

Параметры запроса:

- `path` (обязательно)
- `version` (необязательно)
- `tag` (необязательно)

Примечания:

- По умолчанию используется последний релиз.
- Использует квоту частоты чтения, а не квоту скачивания.
- Двоичные файлы возвращают `415`.
- Ограничение размера файла: 200KB.
- Ожидающие сканирования VirusTotal не блокируют чтение; вредоносные релизы все еще могут удерживаться в других местах.
- Приватные пакеты возвращают `404`, если вызывающий не может читать владеющего издателя.

### `GET /api/v1/packages/{name}/download`

Скачивает устаревший детерминированный ZIP-архив для релиза пакета.

Параметры запроса:

- `version` (необязательно)
- `tag` (необязательно)

Примечания:

- По умолчанию используется последний релиз.
- Skills перенаправляют на `GET /api/v1/download`.
- Архивы Plugin/пакетов являются zip-файлами с корнем `package/`, чтобы старые клиенты OpenClaw
  продолжали работать.
- Этот маршрут остается только ZIP. Он не передает потоково файлы ClawPack `.tgz`.
- Ответы включают заголовки `ETag`, `Digest`, `X-ClawHub-Artifact-Type` и
  `X-ClawHub-Artifact-Sha256` для проверок целостности резолвера.
- Метаданные только из реестра не внедряются в скачиваемый архив.
- Ожидающие сканирования VirusTotal не блокируют скачивания; вредоносные релизы возвращают `403`.
- Приватные пакеты возвращают `404`, если вызывающий не является владельцем.

### `GET /api/npm/{package}`

Возвращает npm-совместимый packument для версий пакета на базе ClawPack.

Примечания:

- Перечисляются только версии с загруженными tarball ClawPack npm-pack.
- Устаревшие версии только с ZIP намеренно опущены.
- `dist.tarball`, `dist.integrity` и `dist.shasum` используют npm-совместимые
  поля, чтобы пользователи могли направить npm на зеркало, если захотят.
- Packument для scoped package поддерживает как `/api/npm/@scope/name`, так и
  закодированный путь запроса npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Передает потоково точные байты загруженного tarball ClawPack для клиентов зеркала npm.

Примечания:

- Использует квоту частоты скачивания.
- Заголовки скачивания включают SHA-256 ClawHub плюс метаданные целостности/shasum npm.
- Проверки модерации и доступа к приватным пакетам по-прежнему применяются.

### `GET /api/v1/resolve`

Используется CLI для сопоставления локального отпечатка с известной версией.

Параметры запроса:

- `slug` (обязательно)
- `hash` (обязательно): 64-символьный hex sha256 отпечатка бандла

Ответ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Скачивает ZIP размещенной версии skill или возвращает передачу исходного кода GitHub для
текущего skill на базе GitHub со сканированием `clean` или `suspicious` и без размещенной
версии.

Параметры запроса:

- `slug` (обязательно)
- `version` (необязательно): строка semver
- `tag` (необязательно): имя тега (например, `latest`)

Примечания:

- Если ни `version`, ни `tag` не предоставлены, используется последняя версия.
- Мягко удаленные версии возвращают `410`.
- Передачи skill на базе GitHub не проксируют и не зеркалируют байты. JSON-ответ
  включает `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  и `archiveUrl`; состояние сканирования/актуальности является шлюзом и не включается как метаданные
  полезной нагрузки успешного ответа.
- Статистика скачиваний считается как уникальные идентичности за день UTC (`userId`, когда API-токен действителен, иначе IP).

## Эндпоинты аутентификации (Bearer-токен)

Все эндпоинты требуют:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Проверяет токен и возвращает handle пользователя.

### `POST /api/v1/skills`

Публикует новую версию.

- Предпочтительно: `multipart/form-data` с JSON `payload` + blob-файлами `files[]`.
- JSON-тело с `files` (на базе storageId) также принимается.
- Необязательное поле payload: `ownerHandle`. Если оно присутствует, API разрешает этого
  издателя на стороне сервера и требует, чтобы у актора был доступ к издателю.
- Необязательное поле payload: `migrateOwner`. При `true` с `ownerHandle` существующий
  skill может перейти к этому владельцу, если актор является администратором/владельцем как у
  текущего, так и у целевого издателя. Без этого явного согласия изменения владельца
  отклоняются.

### `POST /api/v1/packages`

Публикует релиз code-plugin или bundle-plugin.

- Требует аутентификацию Bearer-токеном.
- Требует `multipart/form-data`.
- Разрешенные поля формы: `payload`, повторяющиеся blob-файлы `files` или одна ссылка на tarball
  `clawpack`. `clawpack` может быть blob `.tgz` или storage id, возвращенным
  потоком upload-url. Публикации со staging storage-id также должны включать
  `clawpackUploadTicket`, возвращенный с этим URL загрузки.
- Используйте либо `files`, либо `clawpack`, но никогда оба в одном запросе.
- JSON-тела и предоставленные вызывающим метаданные `payload.files` / `payload.artifact`
  отклоняются.
- Прямые multipart-запросы публикации ограничены 18MB. Tarball ClawPack могут
  использовать поток upload-url до лимита tarball 120MB.
- Необязательное поле payload: `ownerHandle`. Если оно присутствует, только администраторы могут публиковать от имени этого владельца.

Основные проверки:

- `family` должен быть `code-plugin` или `bundle-plugin`.
- Пакеты Plugin требуют `openclaw.plugin.json`. Загрузки ClawPack `.tgz` должны
  содержать его в `package/openclaw.plugin.json`.
- Code plugins требуют `package.json`, метаданные исходного репозитория, метаданные исходного коммита,
  метаданные схемы конфигурации, `openclaw.compat.pluginApi` и
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` и `openclaw.environment` являются необязательными метаданными.
- Только издатель организации `openclaw` и личные издатели текущих участников организации `openclaw`
  могут публиковать в канал `official`.
- Публикации от имени другого пользователя все равно проверяют право на официальный канал относительно целевой учетной записи владельца.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Мягкое удаление / восстановление skill (владелец, модератор или администратор).

Необязательное JSON-тело:

```json
{ "reason": "Held for moderation pending legal review." }
```

Если присутствует, `reason` сохраняется как примечание модерации skill и копируется в журнал аудита.
Мягкие удаления, инициированные владельцем, резервируют slug на 30 дней, затем slug может быть занят
другим издателем. Ответ удаления включает `slugReservedUntil`, когда применяется этот срок истечения.
Скрытия модератором/администратором и удаления по соображениям безопасности не истекают таким образом.

Ответ удаления:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Коды состояния:

- `200`: ок
- `401`: не авторизован
- `403`: запрещено
- `404`: skill/пользователь не найден
- `500`: внутренняя ошибка сервера

### `POST /api/v1/users/publisher`

Только для администратора. Гарантирует существование издателя-организации для handle. Если handle все еще указывает на
устаревшего общего пользователя/личного издателя, эндпоинт сначала мигрирует его в издателя-организацию.
Для новой организации укажите `memberHandle`; действующий администратор не добавляется как участник.
`memberRole` по умолчанию равен `owner`.

- Тело: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Ответ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Аутентифицированное самостоятельное создание издателя-организации. Создает нового издателя-организацию и добавляет
вызывающего как владельца. Этот эндпоинт не мигрирует существующие пользовательские/личные handle и
не помечает издателя как доверенного/официального.

- Тело: `{ "handle": "opik", "displayName": "Opik" }`
- Ответ: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Возвращает `409`, когда handle уже используется издателем, пользователем или личным издателем.

### `POST /api/v1/users/reserve`

Только для администратора. Резервирует корневые slug и имена пакетов для законного владельца без публикации
релиза. Имена пакетов становятся приватными пакетами-заглушками без строк релизов, поэтому тот же
владелец позже может опубликовать настоящий релиз code-plugin или bundle-plugin в это имя.

- Тело: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Ответ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Только для администратора. Восстанавливает личного издателя для проверенного заменяющего principal GitHub OAuth
без редактирования строк учетной записи Convex Auth. Запрос должен указывать оба неизменяемых id учетных записей
провайдера GitHub; изменяемые handle используются только как предохранитель, видимый оператору.

По умолчанию endpoint работает в режиме dry-run. Для применения восстановления требуются `dryRun: false` и
`confirmIdentityVerified: true` после того, как сотрудники независимо проверят непрерывность между обоими
субъектами GitHub. Восстановление завершается в fail-closed режиме, если текущий личный
издатель целевого пользователя имеет Skills, пакеты или источники Skills GitHub.
Восстановление также переносит устаревшие поля `ownerUserId` для Skills восстановленного издателя,
алиасов slug Skills, пакетов, предупреждений инспектора пакетов и производных строк поискового дайджеста, чтобы
пути прямого владельца согласовывались с новыми полномочиями издателя. Активное резервирование защищенного handle
для восстановленного handle также переназначается пользователю-замене, чтобы последующая
синхронизация профиля не могла восстановить конкурирующие полномочия прежнего пользователя. Каждая основная таблица ограничена
100 строками на транзакцию применения; для более крупных восстановлений сначала требуется использовать возобновляемую миграцию владельца.
Источники Skills GitHub имеют область действия издателя и сообщаются как проверенные, а не перезаписываются.

- Body: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Проверена непрерывность учетной записи для issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Response: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Проверена непрерывность учетной записи для issue #2555" }`

### Endpoints управления slug владельца

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Response: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Response: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Примечания:

- Оба endpoints требуют аутентификацию по API-токену и работают только для владельца Skills.
- `rename` сохраняет предыдущий slug как алиас перенаправления.
- `merge` скрывает исходную запись и перенаправляет исходный slug на целевую запись.

### Endpoints передачи владения

- `POST /api/v1/skills/{slug}/transfer`
  - Body: `{ "toUserHandle": "target_handle", "message": "необязательно" }`
  - Response: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Response (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Форма ответа: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Демо" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Заблокировать пользователя и безвозвратно удалить принадлежащие ему Skills (только модератор/администратор).

Body:

```json
{ "handle": "user_handle", "reason": "необязательная причина блокировки" }
```

или

```json
{ "userId": "users_...", "reason": "необязательная причина блокировки" }
```

Response:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Разблокировать пользователя и восстановить подходящие Skills (только администратор).

Body:

```json
{ "handle": "user_handle", "reason": "необязательная причина разблокировки" }
```

или

```json
{ "userId": "users_...", "reason": "необязательная причина разблокировки" }
```

Response:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

Изменить сохраненную причину существующей блокировки без разблокировки или восстановления
контента (только администратор). По умолчанию используется dry-run, если `dryRun` не равно `false`.

Body:

```json
{ "handle": "user_handle", "reason": "массовая публикация спама", "dryRun": true }
```

или

```json
{ "userId": "users_...", "reason": "массовая публикация спама", "dryRun": false }
```

Response:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "автоматическая блокировка за вредоносное ПО",
  "nextReason": "массовая публикация спама",
  "changed": true
}
```

### `POST /api/v1/users/role`

Изменить роль пользователя (только администратор).

Body:

```json
{ "handle": "user_handle", "role": "moderator" }
```

или

```json
{ "userId": "users_...", "role": "admin" }
```

Response:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

Вывести список пользователей или выполнить поиск пользователей (только администратор).

Параметры запроса:

- `q` (необязательно): поисковый запрос
- `query` (необязательно): алиас для `q`
- `limit` (необязательно): максимальное количество результатов (по умолчанию 20, максимум 200)

Response:

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "Пользователь",
      "name": "Пользователь",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

Добавить/удалить звезду (выделение). Оба endpoints идемпотентны.

Ответы:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Устаревшие endpoints CLI (не рекомендуются)

Все еще поддерживаются для старых версий CLI:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

См. `DEPRECATIONS.md` для плана удаления.

`POST /api/cli/upload-url` возвращает `uploadUrl` и `uploadTicket`. Публикации пакетов,
которые подготавливают tarball ClawPack, должны отправлять полученный storage id как
`clawpack`, а возвращенный ticket как `clawpackUploadTicket`.

## Обнаружение registry (`/.well-known/clawhub.json`)

CLI может обнаруживать настройки registry/auth с сайта:

- `/.well-known/clawhub.json` (JSON, предпочтительно)
- `/.well-known/clawdhub.json` (устаревшее)

Схема:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Если вы размещаете самостоятельно, отдавайте этот файл (или явно задайте `CLAWHUB_REGISTRY`; устаревший `CLAWDHUB_REGISTRY`).
