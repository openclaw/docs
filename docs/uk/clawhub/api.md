---
read_when:
    - Створення API-клієнтів
    - Додавання кінцевих точок або схем
summary: Огляд і домовленості публічного REST API (v1).
x-i18n:
    generated_at: "2026-07-04T15:33:49Z"
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

Ви можете створити сторонній каталог, довідник або поверхню пошуку на основі публічних API читання ClawHub. Публічні метадані Skills і файли Skills публікуються згідно з правилами ліцензування Skills у ClawHub, тоді як сам API має обмеження частоти запитів і його слід використовувати відповідально.

Рекомендації:

- Використовуйте публічні кінцеві точки читання, як-от `GET /api/v1/skills`, `GET /api/v1/search` і `GET /api/v1/skills/{slug}`, для списків каталогу.
- Кешуйте відповіді та враховуйте `429`, `Retry-After` і заголовки обмеження частоти запитів замість агресивного опитування.
- Додавайте посилання на канонічну URL-адресу Skills у ClawHub під час відображення списків, щоб користувачі могли переглянути вихідний запис реєстру.
- Використовуйте канонічні URL-адреси сторінок у формі `https://clawhub.ai/<owner>/skills/<slug>`.
- Не створюйте враження, що ClawHub схвалює, перевіряє або керує стороннім сайтом.
- Не дзеркалюйте прихований, приватний або заблокований модерацією вміст шляхом обходу фільтрів публічного API чи меж автентифікації.

## Автентифікація

- Публічне читання: токен не потрібен.
- Запис + обліковий запис: `Authorization: Bearer clh_...`.

## Обмеження частоти запитів

Застосування з урахуванням автентифікації:

- Анонімні запити: за IP-адресою.
- Автентифіковані запити (дійсний Bearer-токен): за кошиком користувача.
- Відсутній/недійсний токен повертається до застосування за IP-адресою.

- Читання: 3000/хв на IP-адресу, 12000/хв на ключ
- Запис: 300/хв на IP-адресу, 3000/хв на ключ
- Завантаження: 1200/хв на IP-адресу, 6000/хв на ключ

Заголовки: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` і `Retry-After` включаються для `429`.

Семантика:

- `X-RateLimit-Reset`: секунди епохи Unix (абсолютний час скидання)
- `RateLimit-Reset`: затримка в секундах до скидання
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: точний залишок бюджету, коли
  присутній; успішні шардовані запити пропускають його, а не повертають приблизне
  глобальне значення
- `Retry-After`: затримка в секундах для очікування при `429`

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
- Інакше використовуйте `RateLimit-Reset` або виводьте затримку з `X-RateLimit-Reset`.
- Додавайте джитер до повторних спроб.

## Помилки

- Помилки v1 є звичайним текстом (`text/plain; charset=utf-8`), зокрема `400`,
  `401`, `403`, `404`, `429` і відповіді заблокованого завантаження.
- Невідомі параметри запиту ігноруються для сумісності.
- Відомі параметри запиту з недійсними значеннями повертають `400`.

## Кінцеві точки

Публічне читання:

- `GET /api/v1/search?q=...`
  - Необов'язкові фільтри: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Застарілий псевдонім: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (типово), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), застарілі псевдоніми встановлення `installsCurrent`/`installs`/`installsAllTime` зіставляються з `downloads`, `trending`
  - Недійсні значення `sort` повертають `400`
  - `cursor` застосовується до сортувань, відмінних від `trending`
  - Необов'язковий фільтр: `nonSuspiciousOnly=true`
  - Застарілий псевдонім: `nonSuspicious=true`
  - З `nonSuspiciousOnly=true` сторінки на основі курсора можуть містити менше ніж `limit` елементів; використовуйте `nextCursor`, щоб продовжити.
  - `recommended` використовує сигнали взаємодії та давності.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Розміщені Skills повертають детерміновані ZIP-байти.
  - Поточні Skills на основі GitHub зі скануванням `clean` або `suspicious` повертають
    JSON-дескриптор передавання `public-github` замість байтів ClawHub.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Розміщені Skills експортуються як збережені файли.
  - Поточні Skills на основі GitHub зі скануванням `clean` або `suspicious` експортуються
    як дескриптори передавання `public-github`.
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

- `POST /api/v1/users/reserve` резервує кореневі слаги та приватні заповнювачі пакетів без релізу для ідентифікатора власника.

## Застаріле

Застарілі `/api/*` і `/api/cli/*` досі доступні. Див. `DEPRECATIONS.md`.
