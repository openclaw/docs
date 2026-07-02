---
read_when:
    - Добавление/изменение конечных точек
    - Отладка запросов CLI ↔ реестр
summary: Справочник HTTP API (общедоступные эндпоинты + эндпоинты CLI + аутентификация).
x-i18n:
    generated_at: "2026-07-02T08:41:05Z"
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

Сторонние каталоги могут использовать публичные конечные точки чтения для вывода списка или поиска Skills ClawHub. Кэшируйте результаты, соблюдайте `429`/`Retry-After`, направляйте пользователей обратно к канонической странице ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) и не создавайте впечатление, что ClawHub одобряет сторонний сайт. Не пытайтесь зеркалировать скрытый, приватный или заблокированный модерацией контент за пределами публичной поверхности API.

Веб-сокращения slug разрешаются между семействами реестра, но API-клиентам следует использовать
канонические URL, возвращаемые конечными точками чтения, вместо самостоятельного восстановления
приоритета маршрутов.

## Ограничения скорости

Модель применения:

- Анонимные запросы: ограничиваются по IP.
- Аутентифицированные запросы (действительный Bearer token): ограничиваются по пользовательскому бакету.
- Если token отсутствует или недействителен, поведение откатывается к ограничению по IP.
- Аутентифицированные конечные точки записи не должны возвращать простой `Unauthorized`, когда
  сервер знает причину. Отсутствующие tokens, недействительные/отозванные tokens и
  удаленные/заблокированные/отключенные учетные записи должны получать понятный текст, чтобы CLI
  клиенты могли сообщить пользователям, что их заблокировало.

- Чтение: 3000/мин на IP, 12000/мин на ключ
- Запись: 300/мин на IP, 3000/мин на ключ
- Скачивание: 1200/мин на IP, 6000/мин на ключ (конечные точки скачивания)

Заголовки:

- Совместимость с устаревшими клиентами: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Стандартизованные: `RateLimit-Limit`, `RateLimit-Reset`
- При `429`: `X-RateLimit-Remaining: 0` и `RateLimit-Remaining: 0`
- При `429`: `Retry-After`

Семантика заголовков:

- `X-RateLimit-Reset`: абсолютное время Unix epoch в секундах
- `RateLimit-Reset`: секунды до сброса (задержка)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: точный оставшийся бюджет, если присутствует.
  Шардированные успешные запросы пропускают этот заголовок вместо возврата приблизительного глобального значения.
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

- Если `Retry-After` существует, подождите указанное число секунд перед повторной попыткой.
- Используйте backoff с jitter, чтобы избежать синхронизированных повторных попыток.
- Если `Retry-After` отсутствует, откатитесь к `RateLimit-Reset` (или вычислите из `X-RateLimit-Reset`).

Источник IP:

- Использует доверенные заголовки IP клиента, включая `cf-connecting-ip`, только когда
  развертывание явно включает доверенные пересылаемые заголовки.
- ClawHub использует доверенные пересылаемые заголовки для определения IP клиентов на edge.
- Если доверенный IP клиента недоступен, анонимные запросы используют резервные бакеты,
  ограниченные только видом ограничения скорости. Эти резервные бакеты не включают
  предоставленные вызывающей стороной пути, slugs, имена пакетов, версии, строки запроса или другие
  параметры артефактов.

## Ответы с ошибками

Публичные ответы об ошибках v1 — это простой текст с `content-type: text/plain; charset=utf-8`.
Сюда входят ошибки валидации (`400`), отсутствующие публичные ресурсы (`404`), ошибки аутентификации и
прав (`401`/`403`), ограничения скорости (`429`) и заблокированные скачивания. Клиенты
должны читать тело ответа как человекочитаемую строку. Неизвестные параметры запроса
игнорируются для совместимости, но распознанные параметры запроса с недопустимыми значениями возвращают
`400`.

## Публичные конечные точки (без auth)

### `GET /api/v1/search`

Параметры запроса:

- `q` (обязательный): строка запроса
- `limit` (необязательный): целое число
- `highlightedOnly` (необязательный): `true` для фильтрации до выделенных Skills
- `nonSuspiciousOnly` (необязательный): `true` для скрытия подозрительных (`flagged.suspicious`) Skills
- `nonSuspicious` (необязательный): устаревший alias для `nonSuspiciousOnly`

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

- Результаты возвращаются в порядке релевантности (embedding-сходство + усиление точных tokens slug/имени + небольшой prior популярности).
- Релевантность сильнее популярности. Точное совпадение token slug или отображаемого имени может ранжироваться выше, чем более свободное совпадение с гораздо более сильной вовлеченностью.
- ASCII-текст токенизируется по границам слов и пунктуации. Например, `personal-map` содержит отдельный token `map`, а `amap-jsapi-skill` содержит `amap`, `jsapi` и `skill`; поэтому поиск `map` дает `personal-map` более сильное лексическое совпадение, чем `amap-jsapi-skill`.
- Популярность логарифмически масштабируется и ограничивается. Skills с высокой вовлеченностью могут ранжироваться ниже, когда текст запроса совпадает слабее.
- Подозрительное или скрытое состояние модерации может убрать Skill из публичного поиска в зависимости от фильтров вызывающей стороны и текущего статуса модерации.

Рекомендации для обнаруживаемости издателя:

- Помещайте термины, которые пользователи будут буквально искать, в отображаемое имя, сводку и теги. Используйте отдельный token slug только когда он также является стабильной идентичностью, которую вы хотите сохранить.
- Не переименовывайте slug только ради одного запроса, если новый slug не является лучшим долгосрочным каноническим именем. Старые slugs становятся alias перенаправления, но канонический URL, отображаемый slug и будущие поисковые дайджесты используют новый slug.
- Alias переименования сохраняют разрешение для старых URL и установок, которые разрешаются через реестр, но поисковое ранжирование основано на канонических метаданных Skill после индексации переименования. Существующая статистика остается со Skill.
- Если Skill неожиданно невидим, сначала проверьте состояние модерации с помощью `clawhub inspect @owner/slug`, войдя в систему, прежде чем менять метаданные, связанные с ранжированием.

### `GET /api/v1/skills`

Параметры запроса:

- `limit` (необязательный): целое число (1–200)
- `cursor` (необязательный): курсор пагинации для любой сортировки, кроме `trending`
- `sort` (необязательный): `updated` (по умолчанию), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), устаревшие install aliases `installsCurrent`/`installs`/`installsAllTime` сопоставляются с `downloads`, `trending`
- `nonSuspiciousOnly` (необязательный): `true` для скрытия подозрительных (`flagged.suspicious`) Skills
- `nonSuspicious` (необязательный): устаревший alias для `nonSuspiciousOnly`

Недопустимые значения `sort` возвращают `400`.

Примечания:

- `recommended` использует сигналы вовлеченности и давности.
- `trending` ранжирует по установкам за последние 7 дней (на основе телеметрии).
- `createdAt` стабилен для обходов новых Skills; `updated` меняется при повторной публикации существующих Skills.
- Когда `nonSuspiciousOnly=true`, сортировки на основе курсора могут возвращать меньше элементов, чем `limit`, на странице, потому что подозрительные Skills фильтруются после получения страницы.
- Используйте `nextCursor`, чтобы продолжить пагинацию, когда он присутствует. Короткая страница сама по себе не означает конец результатов.

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

- Старые slugs, созданные потоками переименования/слияния владельца, разрешаются в канонический Skill.
- `metadata.os`: ограничения ОС, объявленные во frontmatter Skill (например, `["macos"]`, `["linux"]`). `null`, если не объявлено.
- `metadata.systems`: целевые системы Nix (например, `["aarch64-darwin", "x86_64-linux"]`). `null`, если не объявлено.
- `metadata` равно `null`, если у Skill нет метаданных платформы.
- `moderation` включается только когда Skill помечен или его просматривает владелец.

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

- Владельцы и модераторы могут получать доступ к деталям модерации для скрытых Skills.
- Публичные вызывающие стороны получают `200` только для уже помеченных видимых Skills.
- Доказательства редактируются для публичных вызывающих сторон и включают исходные фрагменты только для владельцев/модераторов.

### `POST /api/v1/skills/{slug}/report`

Сообщить о Skill для проверки модератором. Жалобы относятся к уровню Skill, необязательно связаны
с версией и попадают в очередь жалоб на Skill.

Auth:

- Требуется API token.

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

Конечная точка модератора/администратора для приема жалоб на Skills.

Параметры запроса:

- `status` (необязательный): `open` (по умолчанию), `confirmed`, `dismissed` или `all`
- `limit` (необязательный): целое число (1-200)
- `cursor` (необязательный): курсор пагинации

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

Конечная точка модератора/администратора для разрешения или повторного открытия жалоб на Skills.

Запрос:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` требуется для `confirmed` и `dismissed`; его можно опустить при
возврате `status` к `open`. Передайте `finalAction: "hide"` с разобранной
жалобой, чтобы скрыть Skill в том же проверяемом workflow.

### `GET /api/v1/skills/{slug}/versions`

Параметры запроса:

- `limit` (необязательный): целое число
- `cursor` (необязательный): курсор пагинации

### `GET /api/v1/skills/{slug}/versions/{version}`

Возвращает метаданные версии + список файлов.

- `version.security` включает нормализованный статус проверки сканирования и сведения о сканере
  (VirusTotal + LLM), когда доступны.

### `GET /api/v1/skills/{slug}/scan`

Возвращает сведения о проверке сканирования безопасности для версии Skill.

Параметры запроса:

- `version` (необязательный): конкретная строка версии.
- `tag` (необязательный): разрешить версию с тегом (например, `latest`).

Примечания:

- Если не указаны ни `version`, ни `tag`, используется последняя версия.
- Включает нормализованный статус проверки и сведения, относящиеся к конкретному сканеру.
- `security.hasScanResult` равно `true` только когда сканер выдал окончательный вердикт (`clean`, `suspicious` или `malicious`).
- `moderation` — это текущий снимок модерации на уровне Skills, полученный из последней версии.
- При запросе исторической версии проверяйте `moderation.matchesRequestedVersion` и `moderation.sourceVersion`, прежде чем считать `moderation` и `security` одним и тем же контекстом версии.

### `POST /api/v1/skills/-/scan`

Аутентифицированная точка отправки для новых заданий ClawScan.

Сканирование локальных загрузок больше не поддерживается. Запросы с
`multipart/form-data` или `{ "source": { "kind": "upload" } }` возвращают `410`.

Опубликованные сканирования используют JSON:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Примечания:

- Полезные нагрузки запросов сканирования и загружаемые отчеты удаляются из хранилища запросов сканирования после истечения окна хранения.
- Опубликованные сканирования требуют доступа владельца/издателя к управлению или полномочий модератора/администратора платформы.
- Опубликованные сканирования выполняют обратную запись только когда `update: true` и сканирование успешно завершено.
- Ответ: `202` с `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Задания сканирования выполняются асинхронно. Ручные запросы сканирования получают приоритет перед обычной публикацией/обратным заполнением, но завершение все равно зависит от доступности воркеров.

### `GET /api/v1/skills/-/scan/{scanId}`

Аутентифицированная точка опроса для отправленного сканирования.

- Возвращает статус в очереди/выполняется/успешно/с ошибкой.
- Возвращает `queue.queuedAhead` и `queue.position`, пока задание находится в очереди, чтобы клиенты могли показывать, сколько приоритетных ручных сканирований находится перед запросом. Очень большие очереди ограничиваются и сообщаются с `queuedAheadIsEstimate: true`.
- Когда доступно, `report` содержит разделы `clawscan`, `skillspector`, `staticAnalysis` и `virustotal`.
- Задания сканирования с ошибкой возвращают `status: "failed"` с `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Аутентифицированная точка получения архива отчета.

- Требует успешно завершенного сканирования; незавершенные сканирования возвращают `409`.
- Возвращает ZIP с `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` и `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Аутентифицированная точка получения сохраненного архива отчета для отправленных версий.

- Требует доступа владельца/издателя к управлению Skills или Plugin либо полномочий модератора/администратора платформы.
- Возвращает сохраненные результаты сканирования для точной отправленной версии, включая заблокированные или скрытые версии.
- `kind` по умолчанию равен `skill`; используйте `kind=plugin` для сканирований Plugin/пакета.
- Возвращает ту же форму ZIP, что и загрузки запросов сканирования.

### `POST /api/v1/skills/-/scan/batch`

Канонический маршрут пакетного повторного сканирования только для администраторов. Принимает ту же форму полезной нагрузки, что и устаревший `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Канонический маршрут статуса пакета только для администраторов. Принимает `{ "jobIds": ["..."] }` и возвращает те же агрегированные счетчики, что и устаревший `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Возвращает конверт проверки Skill Card, используемый `clawhub skill verify`.

Параметры запроса:

- `version` (необязательно): строка конкретной версии.
- `tag` (необязательно): разрешить версию с тегом (например, `latest`).

Примечания:

- `ok` равно `true` только когда для выбранной версии сгенерирована Skill Card, она не заблокирована модерацией как вредоносная, и проверка ClawScan чистая.
- Идентификатор Skills, идентификатор издателя и метаданные выбранной версии являются полями верхнего уровня конверта (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), чтобы shell-автоматизация могла читать их без распаковки вложенных оберток.
- `security` — это вердикт ClawScan/безопасности верхнего уровня. Автоматизация должна опираться на `ok`, `decision`, `reasons` и `security.status`.
- `security.signals` содержит подтверждающие данные сканеров, такие как `staticScan`, `virusTotal` и `skillSpector`.
- `security.signals.dependencyRegistry` сохранен для совместимости ответа v1, но сканер наличия реестра зависимостей выведен из эксплуатации, и этот ключ всегда равен `null`.
- `provenance` равно `server-resolved-github-import` только когда ClawHub разрешил и сохранил репозиторий/ref/commit/path GitHub во время публикации или импорта; в остальных случаях оно равно `unavailable`.

### `POST /api/v1/skills/-/security-verdicts`

Возвращает текущие компактные вердикты безопасности для точных версий Skills. Эта
точка коллекции предназначена для клиентов, которые уже знают, какие установленные
версии ClawHub Skills им нужно отобразить, например OpenClaw Control UI.

Запрос:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Примечания:

- `items` должен содержать 1–100 уникальных пар `{ slug, version }`.
- Результаты возвращаются по каждому элементу; один отсутствующий Skills или версия не приводят к ошибке всего ответа.
- Ответ содержит только сведения о безопасности. Он не включает данные Skill Card, статус сгенерированной карточки, списки файлов артефактов или подробные полезные нагрузки сканеров.
- `security.signals` содержит только подтверждающие данные на уровне статуса; используйте `/scan` или страницу аудита безопасности ClawHub для полных сведений сканеров.
- `security.signals.dependencyRegistry` сохранен для совместимости ответа v1, но сканер наличия реестра зависимостей выведен из эксплуатации, и этот ключ всегда равен `null`.
- Отсутствие Skill Card не влияет на `ok`, `decision` или `reasons` этой точки; клиенты должны читать установленный `skill-card.md` локально, когда им нужно содержимое карточки.
- Используйте `/verify`, когда нужен конверт проверки Skill Card для одного Skills, `/card`, когда нужен сгенерированный Markdown карточки, и `/scan`, когда нужны подробные данные сканеров.

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
  устаревшие псевдонимы фильтров v1 документированы в разделе `GET /api/v1/plugins`.

Примечания:

- Недопустимые значения для `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` или `sort` возвращают `400`. Неизвестные параметры запроса игнорируются.
- `GET /api/v1/code-plugins` и `GET /api/v1/bundle-plugins` остаются псевдонимами с фиксированным семейством.
- Записи Skills по-прежнему поддерживаются реестром Skills и могут публиковаться только через `POST /api/v1/skills`.
- `POST /api/v1/packages` по-прежнему предназначен только для выпусков code-plugin и bundle-plugin.
- Анонимные вызывающие стороны видят только общедоступные каналы пакетов.
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
  фильтров v1 документированы в разделе `GET /api/v1/plugins`.

Примечания:

- Недопустимые значения для `family`, `channel`, `isOfficial`, `featured` или
  `highlightedOnly` возвращают `400`. Неизвестные параметры запроса игнорируются.
- Анонимные вызывающие стороны видят только общедоступные каналы пакетов.
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

- `mcp-tooling`, `data` и `automation` разрешаются в `tools`.
- `observability` и `deployment` разрешаются в `gateway`.
- `dev-tools` разрешается в `runtime`.

`trending` — это семидневный рейтинг установок/загрузок, который не использует совокупные итоги за все время.
На единой конечной точке `/api/v1/packages` он доступен только для plugin; используйте
`/api/v1/skills?sort=trending` для каталога Skills.

Устаревшие псевдонимы не принимаются как сохраненные или объявленные автором значения категории.

### `GET /api/v1/skills/export`

Массовый экспорт последних общедоступных Skills для автономного анализа.

Аутентификация:

- Требуется API-токен.

Параметры запроса:

- `startDate` (обязательный): нижняя граница в миллисекундах Unix для `updatedAt` Skills.
- `endDate` (обязательный): верхняя граница в миллисекундах Unix для `updatedAt` Skills.
- `limit` (необязательный): целое число (1-250), по умолчанию `250`.
- `cursor` (необязательный): курсор пагинации из предыдущего ответа.

Ответ:

- Тело: ZIP-архив.
- Каждый экспортированный Skill размещается в корне `{publisher}/{slug}/`.
- Размещенные Skills включают файлы последней сохраненной версии и перечислены в
  `_manifest.json` с `sourceRef: "public-clawhub"`.
- Текущие Skills, поддерживаемые GitHub, со сканированием `clean` или `suspicious` включают
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

Массовый экспорт последних публичных релизов Plugin для офлайн-анализа.

Аутентификация:

- Требуется API-токен.

Параметры запроса:

- `startDate` (обязательный): нижняя граница в миллисекундах Unix для `updatedAt` Plugin.
- `endDate` (обязательный): верхняя граница в миллисекундах Unix для `updatedAt` Plugin.
- `limit` (необязательный): целое число (1-250), по умолчанию `250`.
- `cursor` (необязательный): курсор пагинации из предыдущего ответа.
- `family` (необязательный): `code-plugin` или `bundle-plugin`. Если опущен, используются оба
  семейства Plugin.

Ответ:

- Тело: ZIP-архив.
- Каждый экспортированный Plugin расположен в корне `{family}/{packageName}/`.
- Каждый экспортированный Plugin включает сохраненные файлы последнего релиза.
- Метаданные экспорта для каждого Plugin сохраняются в
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` всегда включается в корень ZIP.
- `_errors.json` включается, когда отдельные Plugin или файлы не удалось
  экспортировать.

Заголовки:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Поиск только по Plugin среди пакетов code-plugin и bundle-plugin.

Параметры запроса:

- `q` (обязательный): строка запроса
- `limit` (необязательный): целое число (1-100)
- `isOfficial` (необязательный): `true` или `false`
- `category` (необязательный): фильтр категории Plugin. Текущие значения:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Примечания:

- Устаревшие псевдонимы фильтров v1, документированные в разделе `GET /api/v1/plugins`, также
  принимаются.
- Фильтрация по категории является настоящим API-фильтром, основанным на строках дайджеста категорий Plugin,
  а не переписыванием поискового запроса.
- Результаты возвращаются в порядке релевантности и в настоящее время не поддерживают пагинацию.
- Элементы управления сортировкой в браузерном UI для поиска Plugin переупорядочивают загруженные релевантные результаты,
  соответствуя текущему поведению просмотра `/skills`.

### `GET /api/v1/packages/{name}`

Возвращает подробные метаданные пакета.

Примечания:

- Skills также могут разрешаться через этот маршрут в объединенном каталоге.
- Приватные пакеты возвращают `404`, если вызывающий не может читать владеющего издателя.

### `DELETE /api/v1/packages/{name}`

Выполняет мягкое удаление пакета и всех релизов.

Примечания:

- Требуется API-токен владельца пакета, владельца/администратора издателя-организации,
  модератора платформы или администратора платформы.

### `GET /api/v1/packages/{name}/versions`

Возвращает историю версий.

Параметры запроса:

- `limit` (необязательный): целое число (1–100)
- `cursor` (необязательный): курсор пагинации

Примечания:

- Приватные пакеты возвращают `404`, если вызывающий не может читать владеющего издателя.

### `GET /api/v1/packages/{name}/versions/{version}`

Возвращает одну версию пакета, включая метаданные файлов, совместимость,
проверку, метаданные артефакта и данные сканирования.

Примечания:

- `version.artifact.kind` имеет значение `legacy-zip` для архивов пакетов старого формата или
  `npm-pack` для релизов на основе ClawPack.
- Релизы ClawPack включают npm-совместимые поля `npmIntegrity`, `npmShasum` и
  `npmTarballName`.
- `version.sha256hash` — устаревшие метаданные совместимости для старых клиентов. Они
  хешируют точные байты ZIP, возвращаемые `/api/v1/packages/{name}/download`.
  Современным клиентам следует использовать `version.artifact.sha256`, который идентифицирует
  канонический артефакт релиза.
- `version.vtAnalysis`, `version.llmAnalysis` и `version.staticScan`
  включаются, когда существуют данные сканирования.
- Приватные пакеты возвращают `404`, если вызывающий не может читать владеющего издателя.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Возвращает точную сводку безопасности и доверия для релиза пакета, используемую
клиентами установки. Это публичная поверхность потребления OpenClaw для решения, можно ли
установить разрешенный релиз.

Аутентификация:

- Публичная конечная точка чтения. Токен владельца, издателя, модератора или администратора
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
  `release.npmShasum` и `release.npmTarballName` присутствуют, когда они известны для
  артефакта релиза.
- `trust.scanStatus` — эффективный статус доверия, выведенный из входных данных сканеров
  и ручной модерации релиза.
- `trust.moderationState` допускает значение null. Оно равно `null`, когда ручная модерация релиза
  отсутствует.
- `trust.blockedFromDownload` — сигнал блокировки установки. OpenClaw и другие
  клиенты установки должны блокировать установку, когда это значение равно `true`, вместо
  повторного вывода правил блокировки из полей сканера или модерации.
- `trust.reasons` — список объяснений для пользователя и аудита. Коды причин
  являются стабильными компактными строками, такими как `manual:quarantined`, `scan:malicious`
  и `package:malicious`.
- `trust.pending` означает, что один или несколько входных сигналов доверия все еще ожидают завершения.
- `trust.stale` означает, что сводка доверия была вычислена на основе устаревших входных данных и
  должна рассматриваться как требующая обновления перед решением о разрешении с высокой уверенностью.

Примечания:

- Эта конечная точка привязана к точной версии. Клиентам следует вызывать ее после разрешения
  версии пакета, которую они намерены установить, а не только после чтения последних
  метаданных пакета.
- Приватные пакеты возвращают `404`, если вызывающий не может читать владеющего издателя.
- Эта конечная точка намеренно уже, чем конечные точки модерации владельцев/модераторов.
  Она раскрывает решение об установке и публичное объяснение, а не личности
  отправителей жалоб, тексты жалоб, приватные доказательства или внутренние сроки
  рассмотрения.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Возвращает явные метаданные разрешителя артефакта для версии пакета.

Примечания:

- Устаревшие версии пакетов возвращают артефакт `legacy-zip` и устаревший ZIP
  `downloadUrl`.
- Версии ClawPack возвращают артефакт `npm-pack`, поля целостности npm,
  `tarballUrl` и устаревший URL совместимости ZIP.
- Это поверхность разрешителя OpenClaw; она избегает угадывания формата архива по
  общему URL.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Скачивает артефакт версии через явный путь разрешителя.

Примечания:

- Версии ClawPack передают поток точных загруженных байтов npm-pack `.tgz`.
- Устаревшие версии ZIP перенаправляют на `/api/v1/packages/{name}/download?version=`.
- Использует корзину ограничения скорости скачивания.

### `GET /api/v1/packages/{name}/readiness`

Возвращает вычисленную готовность для будущего потребления OpenClaw.

Проверки готовности охватывают:

- статус официального канала
- доступность последней версии
- доступность артефакта ClawPack npm-pack
- дайджест артефакта
- происхождение исходного репозитория и коммита
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

Конечная точка модератора для вывода строк миграции официальных Plugin OpenClaw.

Аутентификация:

- Требуется API-токен пользователя-модератора или администратора.

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

Административная конечная точка для создания или обновления строки миграции официального Plugin.

Аутентификация:

- Требуется API-токен пользователя-администратора.

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
- `packageName` нормализуется как npm-имя; пакет может отсутствовать для запланированных
  миграций.
- Это отслеживает только готовность миграции. Это не изменяет OpenClaw и не генерирует
  ClawPack.

### `GET /api/v1/packages/moderation/queue`

Конечная точка модератора/администратора для очередей проверки релизов пакетов.

Аутентификация:

- Требуется API-токен пользователя-модератора или администратора.

Параметры запроса:

- `status` (необязательный): `open` (по умолчанию), `blocked`, `manual` или `all`
- `limit` (необязательный): целое число (1-100)
- `cursor` (необязательный): курсор пагинации

Значения статусов:

- `open`: подозрительные, вредоносные, ожидающие, помещенные в карантин, отозванные или пожалованные релизы.
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

Сообщает о пакете для проверки модератором. Жалобы относятся к уровню пакета и могут
необязательно быть связаны с версией. Они поступают в очередь модерации, но сами по себе
не скрывают и не блокируют скачивания автоматически; модераторам следует использовать модерацию релизов, чтобы
одобрять, помещать в карантин или отзывать артефакты.

Аутентификация:

- Требуется API-токен.

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

Модераторская/административная конечная точка для приема отчетов о пакетах.

Аутентификация:

- Требуется API-токен пользователя-модератора или администратора.

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

Конечная точка владельца/модератора для видимости модерации пакета.

Аутентификация:

- Требуется API-токен владельца пакета, участника издателя, модератора или
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

Модераторская/административная конечная точка для разрешения или повторного открытия отчетов о пакетах.

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
`finalAction: "revoke"` с подтвержденным отчетом, чтобы применить модерацию релиза в том же
проверяемом рабочем процессе.

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

Модераторская/административная конечная точка для проверки релиза пакета.

Запрос:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Поддерживаемые состояния:

- `approved`: вручную проверено и разрешено.
- `quarantined`: заблокировано до дальнейшей проверки.
- `revoked`: заблокировано после того, как релиз ранее считался доверенным.

Релизы в карантине и отозванные релизы возвращают `403` из маршрутов скачивания артефактов.
Каждое изменение записывает запись в журнал аудита.

### `GET /api/v1/packages/{name}/file`

Возвращает необработанное текстовое содержимое файла пакета.

Параметры запроса:

- `path` (обязательно)
- `version` (необязательно)
- `tag` (необязательно)

Примечания:

- По умолчанию используется последний релиз.
- Использует лимит чтения, а не лимит скачивания.
- Двоичные файлы возвращают `415`.
- Ограничение размера файла: 200 КБ.
- Ожидающие сканирования VirusTotal не блокируют чтение; вредоносные релизы все еще могут удерживаться в других местах.
- Частные пакеты возвращают `404`, если вызывающий не может читать владеющего издателя.

### `GET /api/v1/packages/{name}/download`

Скачивает устаревший детерминированный ZIP-архив для релиза пакета.

Параметры запроса:

- `version` (необязательно)
- `tag` (необязательно)

Примечания:

- По умолчанию используется последний релиз.
- Skills перенаправляют на `GET /api/v1/download`.
- Архивы Plugin/пакетов являются ZIP-файлами с корнем `package/`, чтобы старые клиенты OpenClaw
  продолжали работать.
- Этот маршрут остается только ZIP. Он не передает потоково файлы ClawPack `.tgz`.
- Ответы включают заголовки `ETag`, `Digest`, `X-ClawHub-Artifact-Type` и
  `X-ClawHub-Artifact-Sha256` для проверок целостности резолвером.
- Метаданные только из реестра не внедряются в скачиваемый архив.
- Ожидающие сканирования VirusTotal не блокируют скачивания; вредоносные релизы возвращают `403`.
- Частные пакеты возвращают `404`, если вызывающий не является владельцем.

### `GET /api/npm/{package}`

Возвращает npm-совместимый packument для версий пакетов на основе ClawPack.

Примечания:

- Перечисляются только версии с загруженными tarball-файлами ClawPack npm-pack.
- Устаревшие версии только с ZIP намеренно опущены.
- `dist.tarball`, `dist.integrity` и `dist.shasum` используют npm-совместимые
  поля, чтобы пользователи могли указать npm на зеркало, если захотят.
- Packument для scoped package поддерживает как `/api/npm/@scope/name`, так и
  закодированный путь запроса npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Передает потоково точные байты загруженного tarball-файла ClawPack для клиентов npm-зеркала.

Примечания:

- Использует лимит скачивания.
- Заголовки скачивания включают SHA-256 ClawHub, а также метаданные npm integrity/shasum.
- Проверки модерации и доступа к частным пакетам все еще применяются.

### `GET /api/v1/resolve`

Используется CLI для сопоставления локального fingerprint с известной версией.

Параметры запроса:

- `slug` (обязательно)
- `hash` (обязательно): 64-символьный шестнадцатеричный sha256 fingerprint пакета

Ответ:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Скачивает ZIP размещенной версии skill или возвращает передачу в источник GitHub для
текущего skill на основе GitHub со сканированием `clean` или `suspicious` и без размещенной
версии.

Параметры запроса:

- `slug` (обязательно)
- `version` (необязательно): строка semver
- `tag` (необязательно): имя тега (например, `latest`)

Примечания:

- Если не указаны ни `version`, ни `tag`, используется последняя версия.
- Мягко удаленные версии возвращают `410`.
- Передачи skill на основе GitHub не проксируют и не зеркалируют байты. JSON-ответ
  включает `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  и `archiveUrl`; состояние сканирования/актуальности является шлюзом и не включается как метаданные
  успешной полезной нагрузки.
- Статистика скачиваний считается как уникальные идентичности за день UTC (`userId`, когда API-токен действителен, иначе IP).

## Конечные точки аутентификации (Bearer token)

Все конечные точки требуют:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Проверяет токен и возвращает handle пользователя.

### `POST /api/v1/skills`

Публикует новую версию.

- Предпочтительно: `multipart/form-data` с JSON `payload` + blob-объектами `files[]`.
- JSON-тело с `files` (на основе storageId) также принимается.
- Необязательное поле payload: `ownerHandle`. Если присутствует, API разрешает этого
  издателя на стороне сервера и требует, чтобы у действующего лица был доступ к издателю.
- Необязательное поле payload: `migrateOwner`. Если `true` вместе с `ownerHandle`, существующий
  skill может перейти к этому владельцу, если действующее лицо является администратором/владельцем и у текущего,
  и у целевого издателя. Без этого явного согласия изменения владельца
  отклоняются.

### `POST /api/v1/packages`

Публикует релиз code-plugin или bundle-plugin.

- Требует аутентификации Bearer token.
- Требует `multipart/form-data`.
- Разрешенные поля формы: `payload`, повторяющиеся blob-объекты `files` или одна ссылка на tarball `clawpack`.
  `clawpack` может быть blob-объектом `.tgz` или storage id, возвращенным
  потоком upload-url. Публикации с подготовленным storage-id также должны включать
  `clawpackUploadTicket`, возвращенный с этим URL загрузки.
- Используйте либо `files`, либо `clawpack`, но никогда оба в одном запросе.
- JSON-тела и предоставленные вызывающим метаданные `payload.files` / `payload.artifact`
  отклоняются.
- Прямые multipart-запросы публикации ограничены 18 МБ. Tarball-файлы ClawPack могут
  использовать поток upload-url до лимита tarball 120 МБ.
- Необязательное поле payload: `ownerHandle`. Если присутствует, только администраторы могут публиковать от имени этого владельца.

Основные моменты валидации:

- `family` должен быть `code-plugin` или `bundle-plugin`.
- Для пакетов Plugin требуется `openclaw.plugin.json`. Загрузки ClawPack `.tgz` должны
  содержать его в `package/openclaw.plugin.json`.
- Code plugins требуют `package.json`, метаданные исходного репозитория, метаданные исходного коммита,
  метаданные схемы конфигурации, `openclaw.compat.pluginApi` и
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` и `openclaw.environment` являются необязательными метаданными.
- Только издатель организации `openclaw` и личные издатели текущих участников организации `openclaw`
  могут публиковать в канал `official`.
- Публикации от имени другого пользователя все равно проверяют право на канал official по целевой учетной записи владельца.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Мягко удалить / восстановить skill (владелец, модератор или администратор).

Необязательное JSON-тело:

```json
{ "reason": "Held for moderation pending legal review." }
```

Если присутствует, `reason` сохраняется как примечание модерации skill и копируется в журнал аудита.
Мягкие удаления, инициированные владельцем, резервируют slug на 30 дней, после чего slug может быть занят
другим издателем. Ответ удаления включает `slugReservedUntil`, когда применяется этот срок истечения.
Скрытия модератором/администратором и удаления по соображениям безопасности таким образом не истекают.

Ответ удаления:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Коды состояния:

- `200`: ok
- `401`: не авторизован
- `403`: запрещено
- `404`: skill/пользователь не найден
- `500`: внутренняя ошибка сервера

### `POST /api/v1/users/publisher`

Только для администратора. Гарантирует существование издателя организации для handle. Если handle все еще указывает на
устаревшего общего пользователя/личного издателя, конечная точка сначала мигрирует его в издателя организации.
Для новой организации укажите `memberHandle`; действующий администратор не добавляется как участник.
`memberRole` по умолчанию равен `owner`.

- Тело: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Ответ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Аутентифицированное самостоятельное создание издателя организации. Создает нового издателя организации и добавляет
вызывающего как владельца. Эта конечная точка не мигрирует существующие пользовательские/личные handle и
не помечает издателя как доверенного/официального.

- Тело: `{ "handle": "opik", "displayName": "Opik" }`
- Ответ: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Возвращает `409`, когда handle уже используется издателем, пользователем или личным издателем.

### `POST /api/v1/users/reserve`

Только для администратора. Резервирует корневые slugs и имена пакетов для законного владельца без публикации
релиза. Имена пакетов становятся частными пакетами-заполнителями без строк релизов, чтобы тот же
владелец позже мог опубликовать настоящий релиз code-plugin или bundle-plugin под этим именем.

- Тело: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Ответ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Только для администратора. Восстанавливает личного издателя для проверенного заменяющего GitHub OAuth principal
без редактирования строк учетных записей Convex Auth. Запрос должен указывать оба неизменяемых GitHub
provider account ids; изменяемые handle используются только как защита, видимая оператору.

По умолчанию эндпоинт работает в режиме пробного запуска. Для применения восстановления требуются `dryRun: false` и
`confirmIdentityVerified: true` после того, как сотрудники независимо проверят непрерывность между обоими
субъектами GitHub. Восстановление отказывает по закрытому сценарию, если у текущего персонального
издателя целевого пользователя есть навыки, пакеты или источники навыков GitHub.
Восстановление также мигрирует устаревшие поля `ownerUserId` для навыков восстановленного издателя,
алиасов slug навыков, пакетов, предупреждений инспектора пакетов и производных строк поискового дайджеста, чтобы
пути прямого владельца согласовывались с новыми полномочиями издателя. Активная резервация защищенного handle
для восстановленного handle также переназначается на заменяющего пользователя, чтобы последующая
синхронизация профиля не могла восстановить конкурирующие полномочия прежнего пользователя. Каждая основная таблица ограничена
100 строками на транзакцию применения; для более крупных восстановлений сначала нужно использовать возобновляемую миграцию владельца.
Источники навыков GitHub привязаны к издателю и помечаются как проверенные, а не перезаписываются.

- Тело: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Ответ: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Эндпоинты управления slug владельца

- `POST /api/v1/skills/{slug}/rename`
  - Тело: `{ "newSlug": "new-canonical-slug" }`
  - Ответ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Тело: `{ "targetSlug": "canonical-target-slug" }`
  - Ответ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Примечания:

- Оба эндпоинта требуют аутентификации с API-токеном и работают только для владельца навыка.
- `rename` сохраняет предыдущий slug как алиас перенаправления.
- `merge` скрывает исходный листинг и перенаправляет исходный slug на целевой листинг.

### Эндпоинты передачи владения

- `POST /api/v1/skills/{slug}/transfer`
  - Тело: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Ответ: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Ответ (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Форма ответа: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Заблокировать пользователя и безвозвратно удалить принадлежащие ему навыки (только модератор/администратор).

Тело:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

или

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

Ответ:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Разблокировать пользователя и восстановить подходящие навыки (только администратор).

Тело:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

или

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

Ответ:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

Изменить сохраненную причину существующей блокировки без разблокировки или восстановления
контента (только администратор). По умолчанию используется пробный запуск, если `dryRun` не равно `false`.

Тело:

```json
{ "handle": "user_handle", "reason": "bulk publishing spam", "dryRun": true }
```

или

```json
{ "userId": "users_...", "reason": "bulk publishing spam", "dryRun": false }
```

Ответ:

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

Изменить роль пользователя (только администратор).

Тело:

```json
{ "handle": "user_handle", "role": "moderator" }
```

или

```json
{ "userId": "users_...", "role": "admin" }
```

Ответ:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

Вывести список пользователей или выполнить поиск по ним (только администратор).

Параметры запроса:

- `q` (необязательно): поисковый запрос
- `query` (необязательно): алиас для `q`
- `limit` (необязательно): максимальное количество результатов (по умолчанию 20, максимум 200)

Ответ:

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

Добавить/удалить звезду (выделение). Оба эндпоинта идемпотентны.

Ответы:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Устаревшие эндпоинты CLI (не рекомендуются)

По-прежнему поддерживаются для старых версий CLI:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

См. `DEPRECATIONS.md` для плана удаления.

`POST /api/cli/upload-url` возвращает `uploadUrl` и `uploadTicket`. Публикации пакетов,
которые размещают tarball ClawPack на промежуточном этапе, должны отправлять полученный id хранилища как
`clawpack`, а возвращенный ticket как `clawpackUploadTicket`.

## Обнаружение реестра (`/.well-known/clawhub.json`)

CLI может обнаруживать настройки реестра/аутентификации с сайта:

- `/.well-known/clawhub.json` (JSON, предпочтительно)
- `/.well-known/clawdhub.json` (устаревшее)

Схема:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Если вы используете самостоятельный хостинг, отдавайте этот файл (или явно задайте `CLAWHUB_REGISTRY`; устаревшее `CLAWDHUB_REGISTRY`).
