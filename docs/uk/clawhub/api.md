---
read_when:
    - Створення API-клієнтів
    - Додавання кінцевих точок або схем
summary: Огляд і правила публічного REST API (v1).
x-i18n:
    generated_at: "2026-05-11T20:23:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b6bb020fec1f8aca039dab4d1a09f7a42c64158ad48bf061ce5dbda819d1987
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

База: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Повторне використання публічного каталогу

Ви можете створити сторонній каталог, директорію або пошукову поверхню на основі публічних API для читання ClawHub. Публічні метадані Skills і файли Skills публікуються за ліцензійними правилами ClawHub для Skills, а сам API має обмеження швидкості, тому його слід використовувати відповідально.

Настанови:

- Використовуйте публічні кінцеві точки читання, як-от `GET /api/v1/skills`, `GET /api/v1/search` і `GET /api/v1/skills/{slug}` для списків каталогу.
- Кешуйте відповіді та поважайте `429`, `Retry-After` і заголовки обмеження швидкості замість агресивного опитування.
- Додавайте посилання на канонічну URL-адресу Skills у ClawHub під час відображення списків, щоб користувачі могли переглянути вихідний запис реєстру.
- Використовуйте канонічні URL-адреси сторінок у формі `https://clawhub.ai/<owner>/<slug>`.
- Не створюйте враження, що ClawHub схвалює, перевіряє або експлуатує сторонній сайт.
- Не дзеркальте прихований, приватний або заблокований модерацією вміст через обхід публічних фільтрів API чи меж автентифікації.

## Автентифікація

- Публічне читання: токен не потрібен.
- Запис + обліковий запис: `Authorization: Bearer clh_...`.

## Обмеження швидкості

Застосування з урахуванням автентифікації:

- Анонімні запити: за IP-адресою.
- Автентифіковані запити (дійсний токен Bearer): за кошиком користувача.
- Відсутній або недійсний токен повертається до застосування за IP-адресою.

- Читання: 600/хв на IP-адресу, 2400/хв на ключ
- Запис: 45/хв на IP-адресу, 180/хв на ключ

Заголовки: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After` (для 429).

Семантика:

- `X-RateLimit-Reset`: секунди епохи Unix (абсолютний час скидання)
- `RateLimit-Reset`: секунди затримки до скидання
- `Retry-After`: секунди затримки очікування для `429`

Приклад `429`:

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

Обробка клієнтом:

- Надавайте перевагу `Retry-After`, якщо він присутній.
- Інакше використовуйте `RateLimit-Reset` або виводьте затримку з `X-RateLimit-Reset`.
- Додавайте джитер до повторних спроб.

## Кінцеві точки

Публічне читання:

- `GET /api/v1/search?q=...`
  - Необов’язкові фільтри: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Застарілий псевдонім: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (за замовчуванням), `createdAt` (`newest`), `downloads`, `stars` (`rating`), `installsCurrent` (`installs`), `installsAllTime`, `trending`
  - `cursor` застосовується до сортувань, відмінних від `trending`
  - Необов’язковий фільтр: `nonSuspiciousOnly=true`
  - Застарілий псевдонім: `nonSuspicious=true`
  - З `nonSuspiciousOnly=true` сторінки на основі курсора можуть містити менше елементів, ніж `limit`; використовуйте `nextCursor`, щоб продовжити.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Потрібна автентифікація:

- `POST /api/v1/skills` (публікація, бажано multipart)
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
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

Лише для адміністратора:

- `POST /api/v1/users/reserve` резервує кореневі слаги та приватні заповнювачі пакетів без релізів для handle власника.

## Застаріле

Застарілі `/api/*` і `/api/cli/*` досі доступні. Див. `DEPRECATIONS.md`.
