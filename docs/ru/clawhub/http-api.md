---
read_when:
    - Добавление/изменение конечных точек
    - Отладка запросов CLI ↔ registry
summary: Справочник HTTP API (публичные + конечные точки CLI + аутентификация).
x-i18n:
    generated_at: "2026-07-01T18:16:48Z"
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

Сторонние каталоги могут использовать публичные эндпоинты чтения для вывода списка или поиска навыков ClawHub. Кэшируйте результаты, соблюдайте `429`/`Retry-After`, отправляйте пользователей обратно к канонической странице ClawHub (`https://clawhub.ai/<owner>/skills/<slug>`) и не создавайте впечатление, что ClawHub одобряет сторонний сайт. Не пытайтесь зеркалировать скрытый, приватный или заблокированный модерацией контент за пределами публичной поверхности API.

Веб-сокращения slug разрешаются между семействами реестра, но клиенты API должны использовать
канонические URL, возвращаемые эндпоинтами чтения, вместо самостоятельного восстановления
приоритета маршрутов.

## Ограничения частоты запросов

Модель применения:

- Анонимные запросы: применяются по IP.
- Аутентифицированные запросы (действительный Bearer-токен): применяются по пользовательскому бакету.
- Если токен отсутствует или недействителен, поведение откатывается к ограничению по IP.
- Аутентифицированные эндпоинты записи не должны возвращать голое `Unauthorized`, когда
  сервер знает причину. Отсутствующие токены, недействительные/отозванные токены и
  удаленные/забаненные/отключенные учетные записи должны получать понятный текст, чтобы CLI
  клиенты могли сообщить пользователям, что именно их заблокировало.

- Чтение: 3000/мин на IP, 12000/мин на ключ
- Запись: 300/мин на IP, 3000/мин на ключ
- Загрузка: 1200/мин на IP, 6000/мин на ключ (эндпоинты загрузки)

Заголовки:

- Устаревшая совместимость: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Стандартизированные: `RateLimit-Limit`, `RateLimit-Reset`
- При `429`: `X-RateLimit-Remaining: 0` и `RateLimit-Remaining: 0`
- При `429`: `Retry-After`

Семантика заголовков:

- `X-RateLimit-Reset`: абсолютное время в секундах Unix epoch
- `RateLimit-Reset`: секунд до сброса (задержка)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: точный оставшийся бюджет, когда присутствует.
  Шардированные успешные запросы опускают этот заголовок вместо возврата приблизительного глобального значения.
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

- Если существует `Retry-After`, подождите указанное число секунд перед повторной попыткой.
- Используйте backoff с jitter, чтобы избежать синхронизированных повторных попыток.
- Если `Retry-After` отсутствует, откатитесь к `RateLimit-Reset` (или вычислите из `X-RateLimit-Reset`).

Источник IP:

- Использует доверенные заголовки IP клиента, включая `cf-connecting-ip`, только когда
  развертывание явно включает доверенные forwarded-заголовки.
- ClawHub использует доверенные forwarding-заголовки для определения IP клиентов на edge.
- Если доверенный IP клиента недоступен, анонимные запросы используют fallback-бакеты,
  ограниченные только типом rate-limit. Эти fallback-бакеты не включают
  переданные вызывающей стороной пути, slug, имена пакетов, версии, query-строки или другие
  параметры артефактов.

## Ответы с ошибками

Публичные ответы об ошибках v1 являются простым текстом с `content-type: text/plain; charset=utf-8`.
Сюда входят ошибки валидации (`400`), отсутствующие публичные ресурсы (`404`), ошибки аутентификации и
разрешений (`401`/`403`), ограничения частоты (`429`) и заблокированные загрузки. Клиенты
должны читать тело ответа как человекочитаемую строку. Неизвестные параметры запроса
игнорируются для совместимости, но распознанные параметры запроса с недействительными значениями возвращают
`400`.

## Публичные эндпоинты (без аутентификации)

### `GET /api/v1/search`

Параметры запроса:

- `q` (обязательный): строка запроса
- `limit` (необязательный): целое число
- `highlightedOnly` (необязательный): `true`, чтобы фильтровать только выделенные навыки
- `nonSuspiciousOnly` (необязательный): `true`, чтобы скрыть подозрительные (`flagged.suspicious`) навыки
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

- Результаты возвращаются в порядке релевантности (embedding-сходство + бусты точных токенов slug/названия + небольшой априорный вес популярности).
- Релевантность сильнее популярности. Точное совпадение токена slug или отображаемого имени может ранжироваться выше, чем более свободное совпадение с намного более сильной вовлеченностью.
- ASCII-текст токенизируется по границам слов и пунктуации. Например, `personal-map` содержит отдельный токен `map`, а `amap-jsapi-skill` содержит `amap`, `jsapi` и `skill`; поэтому поиск `map` дает `personal-map` более сильное лексическое совпадение, чем `amap-jsapi-skill`.
- Популярность логарифмически масштабируется и ограничивается сверху. Навыки с высокой вовлеченностью могут ранжироваться ниже, когда текст запроса совпадает слабее.
- Подозрительное или скрытое состояние модерации может убрать навык из публичного поиска в зависимости от фильтров вызывающей стороны и текущего статуса модерации.

Рекомендации по обнаруживаемости для издателей:

- Помещайте термины, которые пользователи буквально будут искать, в отображаемое имя, сводку и теги. Используйте отдельный токен slug только когда он также является стабильной идентичностью, которую вы хотите сохранить.
- Не переименовывайте slug только ради одного запроса, если новый slug не является лучшим долгосрочным каноническим именем. Старые slug становятся redirect-alias, но канонический URL, отображаемый slug и будущие поисковые дайджесты используют новый slug.
- Alias переименования сохраняют разрешение для старых URL и установок, которые разрешаются через реестр, но поисковое ранжирование основано на канонических метаданных навыка после индексации переименования. Существующая статистика остается с навыком.
- Если навык неожиданно невидим, сначала проверьте состояние модерации с помощью `clawhub inspect @owner/slug`, войдя в систему, прежде чем менять метаданные, связанные с ранжированием.

### `GET /api/v1/skills`

Параметры запроса:

- `limit` (необязательный): целое число (1–200)
- `cursor` (необязательный): курсор пагинации для любой сортировки, кроме `trending`
- `sort` (необязательный): `updated` (по умолчанию), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), устаревшие install-alias `installsCurrent`/`installs`/`installsAllTime` сопоставляются с `downloads`, `trending`
- `nonSuspiciousOnly` (необязательный): `true`, чтобы скрыть подозрительные (`flagged.suspicious`) навыки
- `nonSuspicious` (необязательный): устаревший alias для `nonSuspiciousOnly`

Недействительные значения `sort` возвращают `400`.

Примечания:

- `recommended` использует сигналы вовлеченности и давности.
- `trending` ранжирует по установкам за последние 7 дней (на основе telemetry).
- `createdAt` стабилен для обходов новых навыков; `updated` меняется, когда существующие навыки публикуются повторно.
- Когда `nonSuspiciousOnly=true`, сортировки на основе курсора могут возвращать меньше элементов, чем `limit`, на странице, потому что подозрительные навыки фильтруются после получения страницы.
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

- Старые slug, созданные потоками переименования/слияния владельца, разрешаются в канонический навык.
- `metadata.os`: ограничения OS, объявленные во frontmatter навыка (например, `["macos"]`, `["linux"]`). `null`, если не объявлено.
- `metadata.systems`: целевые системы Nix (например, `["aarch64-darwin", "x86_64-linux"]`). `null`, если не объявлено.
- `metadata` равно `null`, если у навыка нет метаданных платформы.
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
- Публичные вызывающие стороны получают `200` только для уже помеченных видимых навыков.
- Доказательства редактируются для публичных вызывающих сторон и включают сырые фрагменты только для владельцев/модераторов.

### `POST /api/v1/skills/{slug}/report`

Сообщить о навыке для проверки модератором. Отчеты относятся к уровню навыка, могут быть опционально связаны
с версией и попадают в очередь отчетов о навыках.

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

Эндпоинт модератора/администратора для приема отчетов о навыках.

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

Эндпоинт модератора/администратора для разрешения или повторного открытия отчетов о навыках.

Запрос:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` обязателен для `confirmed` и `dismissed`; его можно опустить при
установке `status` обратно в `open`. Передайте `finalAction: "hide"` с triaged
отчетом, чтобы скрыть навык в том же аудируемом рабочем процессе.

### `GET /api/v1/skills/{slug}/versions`

Параметры запроса:

- `limit` (необязательный): целое число
- `cursor` (необязательный): курсор пагинации

### `GET /api/v1/skills/{slug}/versions/{version}`

Возвращает метаданные версии + список файлов.

- `version.security` включает нормализованный статус проверки сканирования и детали сканера
  (VirusTotal + LLM), когда доступны.

### `GET /api/v1/skills/{slug}/scan`

Возвращает детали проверки сканирования безопасности для версии навыка.

Параметры запроса:

- `version` (необязательный): конкретная строка версии.
- `tag` (необязательный): разрешить тегированную версию (например, `latest`).

Примечания:

- Если не указан ни `version`, ни `tag`, используется последняя версия.
- Включает нормализованный статус проверки, а также сведения, специфичные для сканера.
- `security.hasScanResult` равно `true` только когда сканер выдал определенный вердикт (`clean`, `suspicious` или `malicious`).
- `moderation` — это текущий снимок модерации на уровне навыка, полученный из последней версии.
- При запросе исторической версии проверьте `moderation.matchesRequestedVersion` и `moderation.sourceVersion`, прежде чем считать `moderation` и `security` контекстом одной и той же версии.

### `POST /api/v1/skills/-/scan`

Аутентифицированный endpoint отправки новых заданий ClawScan.

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

- Полезные нагрузки запросов сканирования и скачиваемые отчеты удаляются из хранилища запросов сканирования после окончания окна хранения.
- Для опубликованных сканирований требуется управленческий доступ владельца/публикатора либо полномочия модератора/администратора платформы.
- Опубликованные сканирования записываются обратно только когда `update: true` и сканирование успешно завершено.
- Ответ — `202` с `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`.
- Задания сканирования асинхронные. Ручные запросы сканирования имеют приоритет перед обычной работой публикации/обратного заполнения, но завершение все равно зависит от доступности воркеров.

### `GET /api/v1/skills/-/scan/{scanId}`

Аутентифицированный endpoint опроса отправленного сканирования.

- Возвращает статус в очереди/выполняется/успешно/с ошибкой.
- Возвращает `queue.queuedAhead` и `queue.position`, пока задание находится в очереди, чтобы клиенты могли показывать, сколько приоритетных ручных сканирований находится перед запросом. Очень большие очереди ограничиваются и сообщаются с `queuedAheadIsEstimate: true`.
- Когда доступно, `report` содержит разделы `clawscan`, `skillspector`, `staticAnalysis` и `virustotal`.
- Задания сканирования с ошибкой возвращают `status: "failed"` с `lastError`.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Аутентифицированный endpoint архива отчета.

- Требует успешно завершенного сканирования; незавершенные сканирования возвращают `409`.
- Возвращает ZIP с `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` и `README.md`.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Аутентифицированный endpoint сохраненного архива отчета для отправленных версий.

- Требует управленческого доступа владельца/публикатора к навыку или plugin либо полномочий модератора/администратора платформы.
- Возвращает сохраненные результаты сканирования для точной отправленной версии, включая заблокированные или скрытые версии.
- `kind` по умолчанию равно `skill`; используйте `kind=plugin` для сканирований plugin/пакетов.
- Возвращает ту же структуру ZIP, что и скачивания запросов сканирования.

### `POST /api/v1/skills/-/scan/batch`

Канонический маршрут пакетного повторного сканирования только для администраторов. Он принимает ту же форму полезной нагрузки, что и устаревший `POST /api/v1/skills/-/rescan-batch`.

### `POST /api/v1/skills/-/scan/batch/status`

Канонический маршрут статуса пакета только для администраторов. Он принимает `{ "jobIds": ["..."] }` и возвращает те же агрегированные счетчики, что и устаревший `POST /api/v1/skills/-/rescan-batch/status`.

### `GET /api/v1/skills/{slug}/verify`

Возвращает конверт проверки карточки навыка, используемый `clawhub skill verify`.

Параметры запроса:

- `version` (необязательно): строка конкретной версии.
- `tag` (необязательно): разрешить версию с тегом (например, `latest`).

Примечания:

- `ok` равно `true` только когда выбранная версия имеет сгенерированную карточку навыка, не заблокирована модерацией как вредоносная и проверка ClawScan чистая.
- Идентичность навыка, идентичность публикатора и метаданные выбранной версии являются полями верхнего уровня конверта (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), чтобы shell-автоматизация могла читать их без распаковки вложенных оберток.
- `security` — это вердикт ClawScan/безопасности верхнего уровня. Автоматизация должна ориентироваться на `ok`, `decision`, `reasons` и `security.status`.
- `security.signals` содержит вспомогательные доказательства сканеров, такие как `staticScan`, `virusTotal` и `skillSpector`.
- `security.signals.dependencyRegistry` сохранено для совместимости ответа v1, но сканер существования реестра зависимостей выведен из эксплуатации, и этот ключ всегда равен `null`.
- `provenance` равно `server-resolved-github-import` только когда ClawHub разрешил и сохранил репозиторий/ref/commit/path GitHub во время публикации или импорта; иначе оно равно `unavailable`.

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
- Результаты выдаются по каждому элементу; один отсутствующий навык или версия не приводит к сбою всего ответа.
- Ответ содержит только данные безопасности. Он не включает данные карточки навыка, статус сгенерированной карточки, списки файлов артефактов или подробные полезные нагрузки сканеров.
- `security.signals` содержит только вспомогательные доказательства уровня статуса; используйте `/scan` или страницу аудита безопасности ClawHub для полных сведений сканера.
- `security.signals.dependencyRegistry` сохранено для совместимости ответа v1, но сканер существования реестра зависимостей выведен из эксплуатации, и этот ключ всегда равен `null`.
- Отсутствие карточки навыка не влияет на `ok`, `decision` или `reasons` этого endpoint; клиенты должны читать установленный `skill-card.md` локально, когда им требуется содержимое карточки.
- Используйте `/verify`, когда нужен конверт проверки карточки одного навыка, `/card`, когда нужен сгенерированный Markdown карточки, и `/scan`, когда нужны подробные данные сканера.

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

- Skills
- кодовых Plugin
- пакетных Plugin

Параметры запроса:

- `limit` (необязательный): целое число (1–100)
- `cursor` (необязательный): курсор пагинации
- `family` (необязательный): `skill`, `code-plugin` или `bundle-plugin`
- `channel` (необязательный): `official`, `community` или `private`
- `isOfficial` (необязательный): `true` или `false`
- `sort` (необязательный): `updated` (по умолчанию), `recommended`, `trending`, `downloads`, устаревший псевдоним `installs`
- `category` (необязательный): фильтр категории Plugin. Поддерживается только когда
  запрос ограничен пакетами Plugin (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` или конечными точками пакетов с
  `family=code-plugin`/`family=bundle-plugin`). Управляемые категории и
  устаревшие псевдонимы фильтров v1 документированы в `GET /api/v1/plugins`.

Примечания:

- Недопустимые значения для `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` или `sort` возвращают `400`. Неизвестные параметры запроса игнорируются.
- `GET /api/v1/code-plugins` и `GET /api/v1/bundle-plugins` остаются псевдонимами с фиксированным семейством.
- Записи Skills по-прежнему основаны на реестре Skills и могут публиковаться только через `POST /api/v1/skills`.
- `POST /api/v1/packages` по-прежнему предназначен только для выпусков code-plugin и bundle-plugin.
- Анонимные вызывающие видят только публичные каналы пакетов.
- Аутентифицированные вызывающие могут видеть приватные пакеты издателей, к которым они относятся, в результатах списка/поиска.
- `channel=private` возвращает только пакеты, которые аутентифицированный вызывающий может читать.

### `GET /api/v1/packages/search`

Единый поиск по каталогу среди Skills и пакетов Plugin.

Параметры запроса:

- `q` (обязательный): строка запроса
- `limit` (необязательный): целое число (1–100)
- `family` (необязательный): `skill`, `code-plugin` или `bundle-plugin`
- `channel` (необязательный): `official`, `community` или `private`
- `isOfficial` (необязательный): `true` или `false`
- `category` (необязательный): фильтр категории Plugin. Поддерживается только когда
  запрос ограничен пакетами Plugin. Управляемые категории и устаревшие
  псевдонимы фильтров v1 документированы в `GET /api/v1/plugins`.

Примечания:

- Недопустимые значения для `family`, `channel`, `isOfficial`, `featured` или
  `highlightedOnly` возвращают `400`. Неизвестные параметры запроса игнорируются.
- Анонимные вызывающие видят только публичные каналы пакетов.
- Аутентифицированные вызывающие могут искать приватные пакеты издателей, к которым они относятся.
- `channel=private` возвращает только пакеты, которые аутентифицированный вызывающий может читать.

### `GET /api/v1/plugins`

Просмотр каталога только Plugin среди пакетов code-plugin и bundle-plugin.

Параметры запроса:

- `limit` (необязательный): целое число (1-100)
- `cursor` (необязательный): курсор пагинации
- `isOfficial` (необязательный): `true` или `false`
- `sort` (необязательный): `recommended` (по умолчанию), `trending`, `downloads`, `updated`, устаревший псевдоним `installs`
- `category` (необязательный): фильтр категории Plugin. Текущие значения:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Устаревшие псевдонимы фильтров v1 по-прежнему принимаются в конечных точках чтения:

- `mcp-tooling`, `data` и `automation` разрешаются как `tools`.
- `observability` и `deployment` разрешаются как `gateway`.
- `dev-tools` разрешается как `runtime`.

`trending` — это рейтинг установок/скачиваний за семь дней, который не использует суммарные показатели за всё время.
В единой конечной точке `/api/v1/packages` он применим только к Plugin; используйте
`/api/v1/skills?sort=trending` для каталога Skills.

Устаревшие псевдонимы не принимаются как сохранённые или объявленные автором значения категорий.

### `GET /api/v1/skills/export`

Массовый экспорт последних публичных Skills для офлайн-анализа.

Аутентификация:

- Требуется API-токен.

Параметры запроса:

- `startDate` (обязательный): нижняя граница Unix в миллисекундах для `updatedAt` Skills.
- `endDate` (обязательный): верхняя граница Unix в миллисекундах для `updatedAt` Skills.
- `limit` (необязательный): целое число (1-250), по умолчанию `250`.
- `cursor` (необязательный): курсор пагинации из предыдущего ответа.

Ответ:

- Тело: ZIP-архив.
- Каждый экспортированный Skill находится в корне `{publisher}/{slug}/`.
- Размещённые Skills включают файлы последней сохранённой версии и перечислены в
  `_manifest.json` с `sourceRef: "public-clawhub"`.
- Текущие Skills на основе GitHub со сканированием `clean` или `suspicious` включают
  `_source_handoff.json` с `sourceRef: "public-github"`, репозиторием, коммитом, путём,
  хешем содержимого и URL архива. Они не включают исходные файлы, размещённые в ClawHub.
- Каждый Skill включает `_export_skill_meta.json`.
- `_manifest.json` всегда включён в корень ZIP.
- `_errors.json` включается, когда отдельные Skills или файлы не удалось
  экспортировать.

Заголовки:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Массовый экспорт последних публичных выпусков плагинов для автономного анализа.

Аутентификация:

- Требуется API-токен.

Параметры запроса:

- `startDate` (обязательный): нижняя граница Unix в миллисекундах для `updatedAt` плагина.
- `endDate` (обязательный): верхняя граница Unix в миллисекундах для `updatedAt` плагина.
- `limit` (необязательный): целое число (1-250), по умолчанию `250`.
- `cursor` (необязательный): курсор пагинации из предыдущего ответа.
- `family` (необязательный): `code-plugin` или `bundle-plugin`. Если не указан, используются оба
  семейства плагинов.

Ответ:

- Тело: ZIP-архив.
- Каждый экспортированный плагин расположен в корне `{family}/{packageName}/`.
- Каждый экспортированный плагин включает сохраненные файлы последнего выпуска.
- Метаданные экспорта для каждого плагина сохраняются в
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`.
- `_manifest.json` всегда включается в корень ZIP-архива.
- `_errors.json` включается, когда отдельные плагины или файлы не удалось
  экспортировать.

Заголовки:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Поиск только по плагинам среди пакетов code-plugin и bundle-plugin.

Параметры запроса:

- `q` (обязательный): строка запроса
- `limit` (необязательный): целое число (1-100)
- `isOfficial` (необязательный): `true` или `false`
- `category` (необязательный): фильтр категории плагина. Текущие значения:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Примечания:

- Устаревшие псевдонимы фильтров v1, документированные в разделе `GET /api/v1/plugins`, также
  принимаются.
- Фильтрация по категории — это настоящий API-фильтр, основанный на строках дайджеста категорий
  плагинов, а не переписывание поискового запроса.
- Результаты возвращаются в порядке релевантности и сейчас не поддерживают пагинацию.
- Элементы управления сортировкой в браузерном UI для поиска плагинов переупорядочивают загруженные результаты по релевантности,
  совпадая с текущим поведением просмотра `/skills`.

### `GET /api/v1/packages/{name}`

Возвращает подробные метаданные пакета.

Примечания:

- Skills также могут разрешаться через этот маршрут в едином каталоге.
- Приватные пакеты возвращают `404`, если вызывающий не может читать владельца-издателя.

### `DELETE /api/v1/packages/{name}`

Выполняет мягкое удаление пакета и всех выпусков.

Примечания:

- Требует API-токен владельца пакета, владельца/администратора издателя организации,
  модератора платформы или администратора платформы.

### `GET /api/v1/packages/{name}/versions`

Возвращает историю версий.

Параметры запроса:

- `limit` (необязательный): целое число (1–100)
- `cursor` (необязательный): курсор пагинации

Примечания:

- Приватные пакеты возвращают `404`, если вызывающий не может читать владельца-издателя.

### `GET /api/v1/packages/{name}/versions/{version}`

Возвращает одну версию пакета, включая метаданные файлов, совместимость,
проверку, метаданные артефакта и данные сканирования.

Примечания:

- `version.artifact.kind` имеет значение `legacy-zip` для архивов пакетов старого мира или
  `npm-pack` для выпусков на основе ClawPack.
- Выпуски ClawPack включают совместимые с npm поля `npmIntegrity`, `npmShasum` и
  `npmTarballName`.
- `version.sha256hash` — устаревшие метаданные совместимости для старых клиентов. Они
  хешируют точные байты ZIP, возвращаемые `/api/v1/packages/{name}/download`.
  Современным клиентам следует использовать `version.artifact.sha256`, который идентифицирует
  канонический артефакт выпуска.
- `version.vtAnalysis`, `version.llmAnalysis` и `version.staticScan`
  включаются, когда существуют данные сканирования.
- Приватные пакеты возвращают `404`, если вызывающий не может читать владельца-издателя.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Возвращает точную сводку безопасности и доверия для выпуска пакета для клиентов
установки. Это публичная поверхность потребления OpenClaw для решения, можно ли
установить разрешенный выпуск.

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
  точный выпуск, который был оценен.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` и `release.npmTarballName` присутствуют, когда они известны для
  артефакта выпуска.
- `trust.scanStatus` — эффективный статус доверия, полученный из входных данных сканеров
  и ручной модерации выпуска.
- `trust.moderationState` может быть null. Он равен `null`, когда ручная
  модерация выпуска отсутствует.
- `trust.blockedFromDownload` — сигнал блокировки установки. OpenClaw и другим
  клиентам установки следует блокировать установку, когда это значение равно `true`, вместо
  повторного вывода правил блокировки из полей сканера или модерации.
- `trust.reasons` — список объяснений для пользователя и аудита. Коды причин
  являются стабильными компактными строками, такими как `manual:quarantined`, `scan:malicious`
  и `package:malicious`.
- `trust.pending` означает, что один или несколько входов доверия все еще ожидают завершения.
- `trust.stale` означает, что сводка доверия была вычислена из устаревших входных данных и
  должна считаться требующей обновления перед решением о разрешении с высокой уверенностью.

Примечания:

- Эта конечная точка точно привязана к версии. Клиентам следует вызывать ее после разрешения
  версии пакета, которую они намерены установить, а не только после чтения последних
  метаданных пакета.
- Приватные пакеты возвращают `404`, если вызывающий не может читать владельца-издателя.
- Эта конечная точка намеренно уже, чем конечные точки модерации для владельцев/модераторов.
  Она раскрывает решение об установке и публичное объяснение, а не
  личности сообщивших, тела отчетов, приватные доказательства или внутренние сроки
  проверки.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Возвращает явные метаданные резолвера артефакта для версии пакета.

Примечания:

- Устаревшие версии пакетов возвращают артефакт `legacy-zip` и устаревший ZIP
  `downloadUrl`.
- Версии ClawPack возвращают артефакт `npm-pack`, поля целостности npm,
  `tarballUrl` и устаревший URL совместимости ZIP.
- Это поверхность резолвера OpenClaw; она избегает угадывания формата архива по
  общему URL.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Скачивает артефакт версии через явный путь резолвера.

Примечания:

- Версии ClawPack передают потоком точные загруженные байты `.tgz` npm-pack.
- Устаревшие ZIP-версии перенаправляют на `/api/v1/packages/{name}/download?version=`.
- Использует корзину лимита скорости скачивания.

### `GET /api/v1/packages/{name}/readiness`

Возвращает вычисленную готовность для будущего потребления OpenClaw.

Проверки готовности охватывают:

- официальный статус канала
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

Конечная точка модератора для перечисления строк миграции официальных плагинов OpenClaw.

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

Административная конечная точка для создания или обновления строки миграции официального плагина.

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
- `packageName` нормализуется как npm-имя; пакет может отсутствовать для запланированных
  миграций.
- Это отслеживает только готовность миграции. Оно не изменяет OpenClaw и не создает
  ClawPacks.

### `GET /api/v1/packages/moderation/queue`

Конечная точка модератора/администратора для очередей проверки выпусков пакетов.

Аутентификация:

- Требует API-токен пользователя-модератора или администратора.

Параметры запроса:

- `status` (необязательный): `open` (по умолчанию), `blocked`, `manual` или `all`
- `limit` (необязательный): целое число (1-100)
- `cursor` (необязательный): курсор пагинации

Значения статуса:

- `open`: подозрительные, вредоносные, ожидающие, помещенные в карантин, отозванные выпуски или выпуски с жалобами.
- `blocked`: помещенные в карантин, отозванные или вредоносные выпуски.
- `manual`: любой выпуск с ручным переопределением модерации.
- `all`: любой выпуск с ручным переопределением, нечистым состоянием сканирования или жалобой на пакет.

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
быть необязательно связаны с версией. Они попадают в очередь модерации, но сами по себе
не скрывают автоматически и не блокируют скачивания; модераторам следует использовать модерацию выпусков, чтобы
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

Конечная точка модератора/администратора для приема отчетов о пакетах.

Аутентификация:

- Требуется API-токен пользователя с ролью модератора или администратора.

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

Конечная точка модератора/администратора для разрешения или повторного открытия отчетов о пакетах.

Запрос:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` требуется для `confirmed` и `dismissed`; его можно опустить при
возврате `status` в `open`. Передайте `finalAction: "quarantine"` или
`finalAction: "revoke"` с подтвержденным отчетом, чтобы применить модерацию релиза в том же
аудируемом рабочем процессе.

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

Конечная точка модератора/администратора для проверки релиза пакета.

Запрос:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Поддерживаемые состояния:

- `approved`: вручную проверено и разрешено.
- `quarantined`: заблокировано до последующей проверки.
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
- Использует корзину лимита чтения, а не корзину лимита скачивания.
- Двоичные файлы возвращают `415`.
- Ограничение размера файла: 200 КБ.
- Ожидающие сканирования VirusTotal не блокируют чтение; вредоносные релизы все еще могут быть заблокированы в других местах.
- Приватные пакеты возвращают `404`, если вызывающий не может читать владельца-издателя.

### `GET /api/v1/packages/{name}/download`

Скачивает устаревший детерминированный ZIP-архив для релиза пакета.

Параметры запроса:

- `version` (необязательно)
- `tag` (необязательно)

Примечания:

- По умолчанию используется последний релиз.
- Skills перенаправляются на `GET /api/v1/download`.
- Архивы Plugin/package являются zip-файлами с корнем `package/`, чтобы старые клиенты OpenClaw
  продолжали работать.
- Этот маршрут остается только ZIP. Он не передает потоково файлы ClawPack `.tgz`.
- Ответы включают заголовки `ETag`, `Digest`, `X-ClawHub-Artifact-Type` и
  `X-ClawHub-Artifact-Sha256` для проверок целостности резолвером.
- Метаданные только из реестра не внедряются в скачанный архив.
- Ожидающие сканирования VirusTotal не блокируют скачивания; вредоносные релизы возвращают `403`.
- Приватные пакеты возвращают `404`, если вызывающий не является владельцем.

### `GET /api/npm/{package}`

Возвращает совместимый с npm packument для версий пакета на базе ClawPack.

Примечания:

- Перечисляются только версии с загруженными tarball-архивами ClawPack npm-pack.
- Устаревшие версии только с ZIP намеренно опущены.
- `dist.tarball`, `dist.integrity` и `dist.shasum` используют совместимые с npm
  поля, чтобы пользователи могли направить npm на зеркало, если выберут это.
- Packument для scoped-пакетов поддерживает как `/api/npm/@scope/name`, так и
  закодированный путь запроса npm `/api/npm/@scope%2Fname`.

### `GET /api/npm/{package}/-/{tarball}.tgz`

Передает потоково точные байты загруженного tarball-архива ClawPack для клиентов npm-зеркала.

Примечания:

- Использует корзину лимита скачивания.
- Заголовки скачивания включают SHA-256 ClawHub, а также метаданные npm integrity/shasum.
- Проверки модерации и доступа к приватным пакетам по-прежнему применяются.

### `GET /api/v1/resolve`

Используется CLI для сопоставления локального отпечатка с известной версией.

Параметры запроса:

- `slug` (обязательно)
- `hash` (обязательно): 64-символьный hex sha256 отпечатка пакета

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

- Если ни `version`, ни `tag` не указаны, используется последняя версия.
- Мягко удаленные версии возвращают `410`.
- Передачи skill на базе GitHub не проксируют и не зеркалируют байты. JSON-ответ
  включает `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  и `archiveUrl`; сканирование/текущее состояние является шлюзом и не включается как метаданные
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

- Предпочтительно: `multipart/form-data` с JSON `payload` + blobs `files[]`.
- JSON-тело с `files` (на основе storageId) также принимается.
- Необязательное поле полезной нагрузки: `ownerHandle`. Если присутствует, API разрешает этого
  издателя на стороне сервера и требует, чтобы у актора был доступ к издателю.
- Необязательное поле полезной нагрузки: `migrateOwner`. Если `true` с `ownerHandle`, существующий
  skill может быть перенесен к этому владельцу, если актор является администратором/владельцем у обоих
  текущего и целевого издателей. Без этого явного согласия изменения владельца
  отклоняются.

### `POST /api/v1/packages`

Публикует релиз code-plugin или bundle-plugin.

- Требуется аутентификация Bearer token.
- Требуется `multipart/form-data`.
- Разрешенные поля формы: `payload`, повторяющиеся blobs `files` или одна ссылка на tarball
  `clawpack`. `clawpack` может быть blob `.tgz` или storage id, возвращенный
  потоком upload-url. Публикации staged storage-id также должны включать
  `clawpackUploadTicket`, возвращенный с этим URL загрузки.
- Используйте либо `files`, либо `clawpack`, но никогда оба в одном запросе.
- JSON-тела и предоставленные вызывающим метаданные `payload.files` / `payload.artifact`
  отклоняются.
- Прямые multipart-запросы публикации ограничены 18 МБ. Tarball-архивы ClawPack могут
  использовать поток upload-url до лимита tarball 120 МБ.
- Необязательное поле полезной нагрузки: `ownerHandle`. Если присутствует, только администраторы могут публиковать от имени этого владельца.

Основные моменты валидации:

- `family` должен быть `code-plugin` или `bundle-plugin`.
- Пакеты Plugin требуют `openclaw.plugin.json`. Загрузки ClawPack `.tgz` должны
  содержать его в `package/openclaw.plugin.json`.
- Code plugins требуют `package.json`, метаданные репозитория исходного кода, метаданные коммита исходного кода,
  метаданные схемы конфигурации, `openclaw.compat.pluginApi` и
  `openclaw.build.openclawVersion`.
- `openclaw.hostTargets` и `openclaw.environment` являются необязательными метаданными.
- Только издатель org `openclaw` и личные издатели текущих участников org `openclaw`
  могут публиковать в канал `official`.
- Публикации от имени другого пользователя все равно проверяют право на official-канал по целевой учетной записи владельца.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Мягко удалить / восстановить skill (владелец, модератор или администратор).

Необязательное JSON-тело:

```json
{ "reason": "Held for moderation pending legal review." }
```

Если присутствует, `reason` сохраняется как заметка модерации skill и копируется в журнал аудита.
Мягкие удаления, инициированные владельцем, резервируют slug на 30 дней, затем slug может быть заявлен
другим издателем. Ответ удаления включает `slugReservedUntil`, когда применяется этот срок истечения.
Скрытия модератором/администратором и удаления по безопасности так не истекают.

Ответ удаления:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Коды состояния:

- `200`: ok
- `401`: не авторизовано
- `403`: запрещено
- `404`: skill/пользователь не найден
- `500`: внутренняя ошибка сервера

### `POST /api/v1/users/publisher`

Только для администраторов. Гарантирует существование org-издателя для handle. Если handle все еще указывает на
устаревшего общего пользователя/личного издателя, конечная точка сначала мигрирует его в org-издателя.
Для новой org укажите `memberHandle`; действующий администратор не добавляется как участник.
`memberRole` по умолчанию равно `owner`.

- Тело: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Ответ: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Аутентифицированное самостоятельное создание org-издателя. Создает нового org-издателя и добавляет
вызывающего как владельца. Эта конечная точка не мигрирует существующие пользовательские/личные handles и
не помечает издателя как доверенного/official.

- Тело: `{ "handle": "opik", "displayName": "Opik" }`
- Ответ: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Возвращает `409`, когда handle уже используется издателем, пользователем или личным издателем.

### `POST /api/v1/users/reserve`

Только для администраторов. Резервирует корневые slugs и имена пакетов для законного владельца без публикации
релиза. Имена пакетов становятся приватными пакетами-заполнителями без строк релизов, поэтому тот же
владелец позже может опубликовать настоящий релиз code-plugin или bundle-plugin под этим именем.

- Тело: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Ответ: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Только для администраторов. Восстанавливает личного издателя для проверенного заменяющего principal GitHub OAuth
без редактирования строк учетных записей Convex Auth. Запрос должен указывать оба неизменяемых идентификатора учетных записей
провайдера GitHub; изменяемые handles используются только как guard для оператора.

По умолчанию конечная точка работает в режиме тестового запуска. Для применения восстановления требуется `dryRun: false` и
`confirmIdentityVerified: true` после того, как сотрудники независимо проверят непрерывность между обоими
GitHub принципалами. Восстановление завершается закрытым отказом, если у текущего личного
издателя пользователя назначения есть skills, пакеты или источники GitHub Skills.
Восстановление также переносит устаревшие поля `ownerUserId` для skills восстановленного издателя,
псевдонимов slug skills, пакетов, предупреждений инспектора пакетов и производных строк поискового дайджеста, чтобы
пути прямого владельца соответствовали новым полномочиям издателя. Активная резервировка защищенного handle
для восстановленного handle также переназначается пользователю-замене, чтобы последующая
синхронизация профиля не могла восстановить конкурирующие полномочия прежнего пользователя. Каждая основная таблица ограничена
100 строками на транзакцию применения; для более крупных восстановлений сначала нужно использовать возобновляемую миграцию владельца.
Источники GitHub Skills имеют область действия издателя и указываются как проверенные, а не переписываются.

- Тело: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Ответ: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Конечные точки управления slug владельца

- `POST /api/v1/skills/{slug}/rename`
  - Тело: `{ "newSlug": "new-canonical-slug" }`
  - Ответ: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Тело: `{ "targetSlug": "canonical-target-slug" }`
  - Ответ: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Примечания:

- Обе конечные точки требуют аутентификацию с API-токеном и работают только для владельца skill.
- `rename` сохраняет предыдущий slug как псевдоним перенаправления.
- `merge` скрывает исходную запись и перенаправляет исходный slug на целевую запись.

### Конечные точки передачи владения

- `POST /api/v1/skills/{slug}/transfer`
  - Тело: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Ответ: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Ответ (принятие/отклонение/отмена): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Форма ответа: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Заблокировать пользователя и безвозвратно удалить принадлежащие ему skills (только модератор/администратор).

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

Разблокировать пользователя и восстановить подходящие skills (только администратор).

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
контента (только администратор). По умолчанию используется тестовый запуск, если `dryRun` не равен `false`.

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

Вывести список пользователей или выполнить поиск пользователей (только администратор).

Параметры запроса:

- `q` (необязательно): поисковый запрос
- `query` (необязательно): псевдоним для `q`
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

Добавить/удалить звезду (избранное). Обе конечные точки идемпотентны.

Ответы:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Устаревшие конечные точки CLI (не рекомендуются)

По-прежнему поддерживаются для старых версий CLI:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

План удаления см. в `DEPRECATIONS.md`.

`POST /api/cli/upload-url` возвращает `uploadUrl` и `uploadTicket`. Публикации пакетов,
которые размещают tarball ClawPack, должны отправлять полученный идентификатор хранилища как
`clawpack`, а возвращенный ticket как `clawpackUploadTicket`.

## Обнаружение реестра (`/.well-known/clawhub.json`)

CLI может обнаруживать настройки реестра/аутентификации с сайта:

- `/.well-known/clawhub.json` (JSON, предпочтительно)
- `/.well-known/clawdhub.json` (устаревшее)

Схема:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Если вы размещаете самостоятельно, обслуживайте этот файл (или явно задайте `CLAWHUB_REGISTRY`; устаревшее `CLAWDHUB_REGISTRY`).
