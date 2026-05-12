---
read_when:
    - Створення API-клієнтів
    - Додавання кінцевих точок або схем
summary: Огляд і домовленості публічного REST API (v1).
x-i18n:
    generated_at: "2026-05-12T08:44:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b6bb020fec1f8aca039dab4d1a09f7a42c64158ad48bf061ce5dbda819d1987
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Базова адреса: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Повторне використання публічного каталогу

Ви можете створити сторонній каталог, директорію або пошукову поверхню на основі публічних API читання ClawHub. Публічні метадані Skills і файли Skills публікуються за правилами ліцензії ClawHub для Skills, тоді як сам API має обмеження частоти й повинен використовуватися відповідально.

Рекомендації:

- Використовуйте публічні кінцеві точки читання, як-от `GET /api/v1/skills`, `GET /api/v1/search` і `GET /api/v1/skills/{slug}` для списків каталогу.
- Кешуйте відповіді та дотримуйтеся `429`, `Retry-After` і заголовків обмеження частоти замість агресивного опитування.
- Додавайте посилання на канонічну URL-адресу Skills у ClawHub під час відображення списків, щоб користувачі могли переглянути вихідний запис реєстру.
- Використовуйте канонічні URL-адреси сторінок у форматі `https://clawhub.ai/<owner>/<slug>`.
- Не створюйте враження, що ClawHub схвалює, перевіряє або керує стороннім сайтом.
- Не дзеркальте прихований, приватний або заблокований модерацією вміст, обходячи публічні фільтри API чи межі автентифікації.

## Автентифікація

- Публічне читання: токен не потрібен.
- Запис + обліковий запис: `Authorization: Bearer clh_...`.

## Обмеження частоти

Застосування з урахуванням автентифікації:

- Анонімні запити: за IP.
- Автентифіковані запити (чинний Bearer-токен): за кошиком користувача.
- Відсутній/недійсний токен повертається до застосування за IP.

- Читання: 600/хв на IP, 2400/хв на ключ
- Запис: 45/хв на IP, 180/хв на ключ

Заголовки: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After` (для 429).

Семантика:

- `X-RateLimit-Reset`: секунди Unix epoch (абсолютний час скидання)
- `RateLimit-Reset`: секунди затримки до скидання
- `Retry-After`: секунди затримки для очікування після `429`

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
- Інакше використовуйте `RateLimit-Reset` або обчислюйте затримку з `X-RateLimit-Reset`.
- Додавайте випадкове відхилення до повторних спроб.

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
  - З `nonSuspiciousOnly=true` сторінки на основі курсора можуть містити менше ніж `limit` елементів; використовуйте `nextCursor`, щоб продовжити.
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

Лише адміністратор:

- `POST /api/v1/users/reserve` резервує кореневі slug і приватні заповнювачі пакетів без випусків для handle власника.

## Застаріле

Застарілі `/api/*` і `/api/cli/*` усе ще доступні. Див. `DEPRECATIONS.md`.
