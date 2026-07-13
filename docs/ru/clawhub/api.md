---
read_when:
    - Создание клиентов API
    - Добавление конечных точек или схем
summary: Обзор и соглашения публичного REST API (v1).
x-i18n:
    generated_at: "2026-07-13T19:35:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Базовый адрес: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Повторное использование публичного каталога

На основе общедоступных API ClawHub для чтения можно создать сторонний каталог, реестр или интерфейс поиска. Общедоступные метаданные и файлы Skills публикуются согласно правилам лицензирования Skills в ClawHub, а сам API имеет ограничения частоты запросов и должен использоваться ответственно.

Рекомендации:

- Используйте общедоступные конечные точки чтения, такие как `GET /api/v1/skills`, `GET /api/v1/search` и `GET /api/v1/skills/{slug}`, для формирования списков каталога.
- Кэшируйте ответы и соблюдайте требования `429`, `Retry-After` и заголовков ограничения частоты запросов вместо частого опроса.
- При отображении списков добавляйте ссылку на канонический URL Skills в ClawHub, чтобы пользователи могли просмотреть исходную запись реестра.
- Используйте канонические URL страниц в формате `https://clawhub.ai/<owner>/skills/<slug>`.
- Не создавайте впечатление, что ClawHub одобряет, проверяет или обслуживает сторонний сайт.
- Не создавайте зеркала скрытого, частного или заблокированного модераторами содержимого в обход фильтров общедоступного API или границ аутентификации.

## Аутентификация

- Общедоступное чтение: токен не требуется.
- Запись и учётная запись: `Authorization: Bearer clh_...`.

## Ограничения частоты запросов

Применение с учётом аутентификации:

- Анонимные запросы: по IP-адресу.
- Аутентифицированные запросы (действительный Bearer-токен): по квоте пользователя.
- При отсутствии или недействительности токена применяется ограничение по IP-адресу.

- Чтение: 3000/мин на IP-адрес, 12000/мин на ключ
- Запись: 300/мин на IP-адрес, 3000/мин на ключ
- Скачивание: 1200/мин на IP-адрес, 6000/мин на ключ

Заголовки: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` и `Retry-After` включаются в `429`.

Семантика:

- `X-RateLimit-Reset`: секунды эпохи Unix (абсолютное время сброса)
- `RateLimit-Reset`: задержка в секундах до сброса
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: точный остаток квоты, если
  он указан; в сегментированных успешных запросах он опускается вместо возврата приблизительного
  глобального значения
- `Retry-After`: задержка в секундах перед повторной попыткой при `429`

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

Обработка на стороне клиента:

- При наличии отдавайте предпочтение `Retry-After`.
- В противном случае используйте `RateLimit-Reset` или вычислите задержку на основе `X-RateLimit-Reset`.
- Добавляйте случайное отклонение к интервалам повторных попыток.

## Ошибки

- Ошибки v1 возвращаются в виде обычного текста (`text/plain; charset=utf-8`), включая `400`,
  `401`, `403`, `404`, `429` и ответы о заблокированном скачивании.
- Неизвестные параметры запроса игнорируются для обеспечения совместимости.
- Известные параметры запроса с недопустимыми значениями возвращают `400`.

## Конечные точки

Общедоступное чтение:

- `GET /api/v1/search?q=...`
  - Необязательные фильтры: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Устаревший псевдоним: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (по умолчанию), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`); устаревшие псевдонимы установки `installsCurrent`/`installs`/`installsAllTime` сопоставляются с `downloads`, `trending`
  - Недопустимые значения `sort` возвращают `400`
  - `cursor` применяется к сортировкам, отличным от `trending`
  - Необязательный фильтр: `nonSuspiciousOnly=true`
  - Устаревший псевдоним: `nonSuspicious=true`
  - При использовании `nonSuspiciousOnly=true` страницы на основе курсора могут содержать меньше `limit` элементов; для продолжения используйте `nextCursor`.
  - `recommended` использует сигналы вовлечённости и актуальности.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Для размещённых Skills возвращаются детерминированные байты ZIP.
  - Для текущих Skills на базе GitHub со сканированием `clean` или `suspicious` вместо байтов ClawHub возвращается
    JSON-дескриптор передачи `public-github`.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Размещённые Skills экспортируются в виде сохранённых файлов.
  - Текущие Skills на базе GitHub со сканированием `clean` или `suspicious` экспортируются
    в виде дескрипторов передачи `public-github`.
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

Требуется аутентификация:

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

Только для администраторов:

- `POST /api/v1/users/reserve` резервирует корневые слаги и частные заполнители пакетов без релизов для идентификатора владельца.

## Устаревшие возможности

Устаревшие `/api/*` и `/api/cli/*` по-прежнему доступны. См. `DEPRECATIONS.md`.
