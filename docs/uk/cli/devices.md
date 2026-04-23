---
read_when:
    - Ви схвалюєте запити на pairing пристроїв
    - Вам потрібно виконати ротацію або відкликати token-и пристроїв
summary: Довідник CLI для `openclaw devices` (pairing пристроїв + ротація/відкликання token-ів)
title: Пристрої
x-i18n:
    generated_at: "2026-04-23T20:47:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: efa76e7aa0d44115f8220eb50fe66812164da02482b9321c90f35a4534a42f12
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Керування запитами на pairing пристроїв і token-ами в межах пристрою.

## Команди

### `openclaw devices list`

Показати список очікуваних запитів на pairing і paired пристроїв.

```
openclaw devices list
openclaw devices list --json
```

Вивід очікуваних запитів показує запитаний доступ поруч із поточним
схваленим доступом пристрою, якщо пристрій уже paired. Це робить
оновлення scope/role явними, замість того щоб виглядало, ніби pairing було втрачено.

### `openclaw devices remove <deviceId>`

Видалити один запис paired пристрою.

Коли ви автентифіковані за допомогою token-а paired пристрою, викликачі без прав admin
можуть видалити лише запис **власного** пристрою. Видалення іншого пристрою потребує
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Масово очистити paired пристрої.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Схвалити очікуваний запит на pairing пристрою за точним `requestId`. Якщо `requestId`
не вказано або передано `--latest`, OpenClaw лише виводить вибраний очікуваний
запит і завершує роботу; повторно запустіть схвалення з точним ID запиту після перевірки
подробиць.

Примітка: якщо пристрій повторює спробу pairing зі зміненими даними автентифікації (role/scopes/public
key), OpenClaw замінює попередній очікуваний запис і видає новий
`requestId`. Запускайте `openclaw devices list` безпосередньо перед схваленням, щоб використовувати
актуальний ID.

Якщо пристрій уже paired і запитує ширші scope або ширшу role,
OpenClaw зберігає чинне схвалення і створює новий очікуваний запит на оновлення.
Перегляньте стовпці `Requested` і `Approved` у `openclaw devices list`
або використайте `openclaw devices approve --latest`, щоб попередньо переглянути точне оновлення перед
схваленням.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Відхилити очікуваний запит на pairing пристрою.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Виконати ротацію token-а пристрою для певної role (за потреби оновивши scopes).
Цільова role вже має існувати в схваленому pairing-контракті цього пристрою;
ротація не може створити нову несхвалену role.
Якщо ви не вкажете `--scope`, наступні повторні підключення зі збереженим rotated token
повторно використають кешовані схвалені scopes цього token-а. Якщо ви передасте явні значення `--scope`,
вони стануть збереженим набором scopes для майбутніх повторних підключень із кешованим token-ом.
Викликачі paired пристроїв без прав admin можуть виконувати ротацію лише **власного** token-а пристрою.
Крім того, будь-які явно передані значення `--scope` мають залишатися в межах власних
operator scopes сесії викликача; ротація не може створити ширший operator token, ніж викликач
уже має.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Повертає новий payload token-а у форматі JSON.

### `openclaw devices revoke --device <id> --role <role>`

Відкликати token пристрою для певної role.

Викликачі paired пристроїв без прав admin можуть відкликати лише **власний** token пристрою.
Відкликання token-а іншого пристрою потребує `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

Повертає результат відкликання у форматі JSON.

## Поширені параметри

- `--url <url>`: URL WebSocket Gateway (за замовчуванням використовується `gateway.remote.url`, якщо налаштовано).
- `--token <token>`: token Gateway (якщо потрібен).
- `--password <password>`: пароль Gateway (автентифікація паролем).
- `--timeout <ms>`: тайм-аут RPC.
- `--json`: вивід JSON (рекомендовано для скриптів).

Примітка: коли ви задаєте `--url`, CLI не повертається до облікових даних із config або environment.
Передайте `--token` або `--password` явно. Відсутність явно переданих облікових даних є помилкою.

## Примітки

- Ротація token-а повертає новий token (чутливі дані). Ставтеся до нього як до секрету.
- Ці команди потребують scope `operator.pairing` (або `operator.admin`).
- Ротація token-а залишається в межах схваленого набору role pairing і базового рівня схвалених scope
  для цього пристрою. Сторонній кешований запис token-а не надає нової
  цілі для ротації.
- Для сесій token-ів paired пристроїв керування між пристроями дозволене лише admin:
  `remove`, `rotate` і `revoke` працюють лише для власного пристрою, якщо викликач не має
  `operator.admin`.
- `devices clear` навмисно захищено прапорцем `--yes`.
- Якщо scope pairing недоступний на local loopback (і явний `--url` не передано), list/approve можуть використовувати локальний fallback pairing.
- `devices approve` вимагає явний ID запиту перед створенням token-ів; якщо не вказати `requestId` або передати `--latest`, буде лише попередній перегляд найновішого очікуваного запиту.

## Контрольний список відновлення при розсинхронізації token-ів

Використовуйте це, коли Control UI або інші клієнти продовжують падати з `AUTH_TOKEN_MISMATCH` або `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Підтвердьте поточне джерело token-а gateway:

```bash
openclaw config get gateway.auth.token
```

2. Виведіть список paired пристроїв і визначте ID потрібного пристрою:

```bash
openclaw devices list
```

3. Виконайте ротацію operator token-а для потрібного пристрою:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Якщо ротації недостатньо, видаліть застарілий pairing і схваліть знову:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Повторіть спробу підключення клієнта з поточним спільним token-ом/паролем.

Примітки:

- Звичайний пріоритет автентифікації при повторному підключенні: спочатку явний спільний token/пароль, потім явний `deviceToken`, потім збережений token пристрою, потім bootstrap token.
- Довірене відновлення після `AUTH_TOKEN_MISMATCH` може тимчасово надсилати разом і спільний token, і збережений token пристрою для однієї обмеженої повторної спроби.

Пов’язане:

- [Усунення несправностей автентифікації Dashboard](/uk/web/dashboard#if-you-see-unauthorized-1008)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting#dashboard-control-ui-connectivity)
