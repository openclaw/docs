---
read_when:
    - Создание API-клиентов
    - Добавление конечных точек или схем
summary: Обзор и соглашения публичного REST API (v1).
x-i18n:
    generated_at: "2026-07-01T15:28:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

База: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Повторное использование публичного каталога

Вы можете создать сторонний каталог, справочник или поисковую поверхность поверх публичных API ClawHub для чтения. Публичные метаданные Skills и файлы Skills публикуются по лицензионным правилам ClawHub для Skills, а сам API ограничен по частоте запросов и должен использоваться ответственно.

Рекомендации:

- Используйте публичные конечные точки чтения, такие как `GET /api/v1/skills`, `GET /api/v1/search` и `GET /api/v1/skills/{slug}`, для списков каталога.
- Кэшируйте ответы и учитывайте `429`, `Retry-After` и заголовки ограничений частоты вместо агрессивного опроса.
- При отображении списков добавляйте ссылку на канонический URL Skills в ClawHub, чтобы пользователи могли просмотреть исходную запись реестра.
- Используйте канонические URL страниц в формате `https://clawhub.ai/<owner>/skills/<slug>`.
- Не подразумевайте, что ClawHub одобряет, проверяет или управляет сторонним сайтом.
- Не зеркалируйте скрытое, приватное или заблокированное модерацией содержимое, обходя публичные фильтры API или границы авторизации.

## Авторизация

- Публичное чтение: токен не требуется.
- Запись + учетная запись: `Authorization: Bearer clh_...`.

## Ограничения частоты

Применение с учетом авторизации:

- Анонимные запросы: по IP.
- Аутентифицированные запросы (действительный Bearer-токен): по пользовательскому бакету.
- Отсутствующий/недействительный токен откатывается к применению ограничений по IP.

- Чтение: 3000/мин на IP, 12000/мин на ключ
- Запись: 300/мин на IP, 3000/мин на ключ
- Скачивание: 1200/мин на IP, 6000/мин на ключ

Заголовки: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` и `Retry-After` включаются при `429`.

Семантика:

- `X-RateLimit-Reset`: секунды эпохи Unix (абсолютное время сброса)
- `RateLimit-Reset`: задержка в секундах до сброса
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: точный оставшийся бюджет, когда
  присутствует; шардированные успешные запросы опускают его вместо возврата приблизительного
  глобального значения
- `Retry-After`: задержка в секундах ожидания при `429`

Пример `429`:

```http
HTTP/2 429
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34
```

Обработка клиентом:

- Предпочитайте `Retry-After`, когда он присутствует.
- Иначе используйте `RateLimit-Reset` или вычисляйте задержку из `X-RateLimit-Reset`.
- Добавляйте джиттер к повторным попыткам.

## Ошибки

- Ошибки v1 представляют собой обычный текст (`text/plain; charset=utf-8`), включая `400`,
  `401`, `403`, `404`, `429` и ответы заблокированных скачиваний.
- Неизвестные параметры запроса игнорируются для совместимости.
- Известные параметры запроса с недопустимыми значениями возвращают `400`.

## Конечные точки

Публичное чтение:

- `GET /api/v1/search?q=...`
  - Необязательные фильтры: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Устаревший псевдоним: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (по умолчанию), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), устаревшие псевдонимы установки `installsCurrent`/`installs`/`installsAllTime` сопоставляются с `downloads`, `trending`
  - Недопустимые значения `sort` возвращают `400`
  - `cursor` применяется к сортировкам, отличным от `trending`
  - Необязательный фильтр: `nonSuspiciousOnly=true`
  - Устаревший псевдоним: `nonSuspicious=true`
  - С `nonSuspiciousOnly=true` страницы на основе курсора могут содержать меньше элементов, чем `limit`; используйте `nextCursor`, чтобы продолжить.
  - `recommended` использует сигналы вовлеченности и давности.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Размещенные Skills возвращают детерминированные байты ZIP.
  - Текущие Skills на базе GitHub со сканированием `clean` или `suspicious` возвращают
    JSON-дескриптор передачи `public-github` вместо байтов ClawHub.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Размещенные Skills экспортируются как сохраненные файлы.
  - Текущие Skills на базе GitHub со сканированием `clean` или `suspicious` экспортируются
    как дескрипторы передачи `public-github`.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (по умолчанию), `recommended`, `downloads`, устаревший псевдоним `installs`
  - Недопустимые значения `sort` возвращают `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (по умолчанию), `downloads`, `updated`, устаревший псевдоним `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Требуется авторизация:

- `POST /api/v1/skills` (публикация, предпочтительно multipart)
- `DELETE /api/v1/skills/{slug}`
- `DELETE /api/v1/packages/{name}`
- `POST /api/v1/skills/{slug}/undelete`
- `POST /api/v1/packages/{name}/undelete`
- `POST /api/v1/skills/{slug}/rename`
- `POST /api/v1/skills/{slug}/merge`
- `POST /api/v1/skills/{slug}/transfer`
- `POST /api/v1/packages/{name}/transfer`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

Только администратор:

- `POST /api/v1/users/reserve` резервирует корневые слаги и приватные заполнители пакетов без релизов для идентификатора владельца.

## Устаревшее

Устаревшие `/api/*` и `/api/cli/*` по-прежнему доступны. См. `DEPRECATIONS.md`.
