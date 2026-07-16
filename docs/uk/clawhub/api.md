---
read_when:
    - Створення клієнтів API
    - Додавання кінцевих точок або схем
summary: Огляд і загальні правила публічного REST API (v1).
x-i18n:
    generated_at: "2026-07-16T17:34:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

База: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Повторне використання загальнодоступного каталогу

На основі загальнодоступних API читання ClawHub можна створити сторонній каталог, довідник або інтерфейс пошуку. Загальнодоступні метадані та файли Skills публікуються відповідно до правил ліцензування Skills у ClawHub, а сам API має обмеження частоти запитів, тому його слід використовувати відповідально.

Рекомендації:

- Для списків каталогу використовуйте загальнодоступні кінцеві точки читання, як-от `GET /api/v1/skills`, `GET /api/v1/search` і `GET /api/v1/skills/{slug}`.
- Кешуйте відповіді та дотримуйтеся `429`, `Retry-After` і заголовків обмеження частоти запитів замість надто частого опитування.
- Під час показу списків додавайте посилання на канонічну URL-адресу Skills у ClawHub, щоб користувачі могли переглянути вихідний запис реєстру.
- Використовуйте канонічні URL-адреси сторінок у форматі `https://clawhub.ai/<owner>/skills/<slug>`.
- Не створюйте враження, що ClawHub схвалює, перевіряє або обслуговує сторонній сайт.
- Не створюйте дзеркальні копії прихованого, приватного або заблокованого модерацією вмісту шляхом обходу фільтрів загальнодоступного API чи меж автентифікації.

## Автентифікація

- Загальнодоступне читання: токен не потрібен.
- Запис і обліковий запис: `Authorization: Bearer clh_...`.

## Обмеження частоти запитів

Застосування з урахуванням автентифікації:

- Анонімні запити: за IP-адресою.
- Автентифіковані запити (дійсний Bearer-токен): за квотою користувача.
- Якщо токен відсутній або недійсний, застосовується обмеження за IP-адресою.

- Читання: 3000/хв на IP-адресу, 12000/хв на ключ
- Запис: 300/хв на IP-адресу, 3000/хв на ключ
- Завантаження: 1200/хв на IP-адресу, 6000/хв на ключ

Заголовки: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` і `Retry-After` включаються до `429`.

Семантика:

- `X-RateLimit-Reset`: секунди епохи Unix (абсолютний час скидання)
- `RateLimit-Reset`: затримка в секундах до скидання
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: точний залишок квоти, якщо
  він наявний; для успішних шардованих запитів його не вказують замість повернення приблизного
  глобального значення
- `Retry-After`: затримка в секундах перед повторною спробою в разі `429`

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

Обробка на стороні клієнта:

- Надавайте перевагу `Retry-After`, якщо він наявний.
- Інакше використовуйте `RateLimit-Reset` або обчислюйте затримку на основі `X-RateLimit-Reset`.
- Додавайте джитер до повторних спроб.

## Помилки

- Помилки v1 повертаються як звичайний текст (`text/plain; charset=utf-8`), зокрема `400`,
  `401`, `403`, `404`, `429` і відповіді про заблоковане завантаження.
- Невідомі параметри запиту ігноруються для забезпечення сумісності.
- Відомі параметри запиту з недійсними значеннями повертають `400`.

## Кінцеві точки

Загальнодоступне читання:

- `GET /api/v1/search?q=...`
  - Необов’язкові фільтри: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Застарілий псевдонім: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (типово), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), застарілі псевдоніми встановлення `installsCurrent`/`installs`/`installsAllTime` зіставляються з `downloads`, `trending`
  - Недійсні значення `sort` повертають `400`
  - `cursor` застосовується до сортувань, відмінних від `trending`
  - Необов’язковий фільтр: `nonSuspiciousOnly=true`
  - Застарілий псевдонім: `nonSuspicious=true`
  - З `nonSuspiciousOnly=true` сторінки на основі курсора можуть містити менше ніж `limit` елементів; для продовження використовуйте `nextCursor`.
  - `recommended` використовує сигнали взаємодії та актуальності.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Розміщені Skills повертають детерміновані байти ZIP.
  - Поточні Skills на основі GitHub зі скануванням `clean` або `suspicious` повертають
    дескриптор передавання `public-github` у форматі JSON замість байтів ClawHub.
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

Лише для адміністраторів:

- `POST /api/v1/users/reserve` резервує кореневі слаги та приватні заповнювачі пакетів без випусків для ідентифікатора власника.

## Застарілий API

Застарілі `/api/*` і `/api/cli/*` досі доступні. Див. `DEPRECATIONS.md`.
