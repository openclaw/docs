---
read_when:
    - Створення API-клієнтів
    - Додавання кінцевих точок або схем
summary: Огляд і правила публічного REST API (v1).
x-i18n:
    generated_at: "2026-06-28T10:01:00Z"
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

## Повторне використання публічного каталогу

Ви можете створити сторонній каталог, довідник або поверхню пошуку на основі публічних API читання ClawHub. Публічні метадані skill і файли skill публікуються відповідно до ліцензійних правил ClawHub для skill, а сам API має обмеження частоти запитів і його слід використовувати відповідально.

Рекомендації:

- Використовуйте публічні кінцеві точки читання, як-от `GET /api/v1/skills`, `GET /api/v1/search` і `GET /api/v1/skills/{slug}` для списків каталогу.
- Кешуйте відповіді та поважайте `429`, `Retry-After` і заголовки обмеження частоти замість агресивного опитування.
- Додавайте посилання на канонічну URL-адресу skill у ClawHub під час показу списків, щоб користувачі могли переглянути вихідний запис реєстру.
- Використовуйте канонічні URL-адреси сторінок у формі `https://clawhub.ai/<owner>/skills/<slug>`.
- Не натякайте, що ClawHub схвалює, перевіряє або керує стороннім сайтом.
- Не дзеркальте прихований, приватний або заблокований модерацією вміст через обхід фільтрів публічного API чи меж автентифікації.

## Автентифікація

- Публічне читання: токен не потрібен.
- Запис + обліковий запис: `Authorization: Bearer clh_...`.

## Обмеження частоти

Застосування з урахуванням автентифікації:

- Анонімні запити: за IP.
- Автентифіковані запити (дійсний Bearer-токен): за кошиком користувача.
- Відсутній/недійсний токен повертається до застосування за IP.

- Читання: 3000/хв на IP, 12000/хв на ключ
- Запис: 300/хв на IP, 3000/хв на ключ
- Завантаження: 1200/хв на IP, 6000/хв на ключ

Заголовки: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` і `Retry-After` включаються для `429`.

Семантика:

- `X-RateLimit-Reset`: секунди Unix epoch (абсолютний час скидання)
- `RateLimit-Reset`: секунди затримки до скидання
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: точний залишковий бюджет, коли
  присутній; шардовані успішні запити пропускають його, а не повертають приблизне
  глобальне значення
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

- Надавайте перевагу `Retry-After`, коли він присутній.
- Інакше використовуйте `RateLimit-Reset` або обчислюйте затримку з `X-RateLimit-Reset`.
- Додавайте jitter до повторних спроб.

## Помилки

- Помилки v1 є звичайним текстом (`text/plain; charset=utf-8`), включно з `400`,
  `401`, `403`, `404`, `429` і відповідями заблокованого завантаження.
- Невідомі параметри запиту ігноруються для сумісності.
- Відомі параметри запиту з недійсними значеннями повертають `400`.

## Кінцеві точки

Публічне читання:

- `GET /api/v1/search?q=...`
  - Необов’язкові фільтри: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Застарілий псевдонім: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (типово), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), застарілі псевдоніми встановлень `installsCurrent`/`installs`/`installsAllTime` відображаються на `downloads`, `trending`
  - Недійсні значення `sort` повертають `400`
  - `cursor` застосовується до сортувань, відмінних від `trending`
  - Необов’язковий фільтр: `nonSuspiciousOnly=true`
  - Застарілий псевдонім: `nonSuspicious=true`
  - З `nonSuspiciousOnly=true` сторінки на основі курсора можуть містити менше ніж `limit` елементів; використовуйте `nextCursor`, щоб продовжити.
  - `recommended` використовує сигнали взаємодії та свіжості.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Розміщені skills повертають детерміновані байти ZIP.
  - Поточні skills на базі GitHub зі скануванням `clean` або `suspicious` повертають
    JSON-дескриптор передачі `public-github` замість байтів ClawHub.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Розміщені skills експортуються як збережені файли.
  - Поточні skills на базі GitHub зі скануванням `clean` або `suspicious` експортуються
    як дескриптори передачі `public-github`.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (типово), `recommended`, `downloads`, застарілий псевдонім `installs`
  - Недійсні значення `sort` повертають `400`
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (типово), `downloads`, `updated`, застарілий псевдонім `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
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
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

Лише адміністратор:

- `POST /api/v1/users/reserve` резервує кореневі slugs і приватні заповнювачі пакетів без випуску для handle власника.

## Застаріле

Застарілі `/api/*` і `/api/cli/*` досі доступні. Див. `DEPRECATIONS.md`.
