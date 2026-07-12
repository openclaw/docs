---
read_when:
    - Ви хочете підключити OpenClaw до SMS через Twilio
    - Вам потрібно налаштувати SMS Webhook або список дозволених номерів
summary: Налаштування каналу SMS Twilio, керування доступом і конфігурація Webhook
title: SMS
x-i18n:
    generated_at: "2026-07-12T12:59:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae0e0fee978a9837fc75ef7e9122bd06009df0d44de35fe9dff8aab120d5404
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw отримує та надсилає SMS через номер телефону Twilio або Messaging Service. Gateway реєструє маршрут вхідного Webhook (типово `/webhooks/sms`), типово перевіряє підписи запитів Twilio та надсилає відповіді через Messages API Twilio.

Статус: офіційний Plugin, установлюється окремо. Лише текст: без MMS і медіафайлів, лише особисті повідомлення.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Типова політика особистих повідомлень для SMS — сполучення.
  </Card>
  <Card title="Безпека Gateway" icon="shield" href="/uk/gateway/security">
    Перевірте доступність Webhook ззовні та засоби керування доступом відправників.
  </Card>
  <Card title="Усунення несправностей каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та інструкції з відновлення.
  </Card>
</CardGroup>

## Перед початком

Вам потрібні:

- Офіційний Plugin SMS, установлений за допомогою `openclaw plugins install @openclaw/sms`.
- Обліковий запис Twilio з номером телефону, що підтримує SMS, або Twilio Messaging Service.
- Account SID і Auth Token Twilio.
- Загальнодоступна URL-адреса HTTPS, через яку можна підключитися до вашого OpenClaw Gateway.
- Вибір політики відправників: `pairing` (типово) для приватного використання, `allowlist` для попередньо схвалених номерів телефону або `open` лише для навмисно загальнодоступного доступу через SMS.

Один номер Twilio може обслуговувати як SMS, так і [голосові виклики](/uk/plugins/voice-call), якщо підтримує обидві можливості. Webhook SMS і Webhook голосових викликів налаштовуються у Twilio окремо та використовують окремі шляхи Gateway; ця сторінка описує лише Webhook SMS.

## Швидке налаштування

<Steps>
  <Step title="Установіть Plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Створіть або виберіть відправника Twilio">
    У Twilio відкрийте **Phone Numbers > Manage > Active numbers** і виберіть номер, що підтримує SMS. Збережіть:

    - Account SID, наприклад `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - Номер телефону відправника, наприклад `+15551234567`

    Якщо замість фіксованого номера відправника ви використовуєте Messaging Service, збережіть SID Messaging Service, наприклад `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="Налаштуйте канал SMS">

Збережіть наведене нижче як `sms.patch.json5` і змініть заповнювачі:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Застосуйте його:

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="Спрямуйте Twilio на Webhook Gateway">
    У налаштуваннях номера телефону Twilio відкрийте **Messaging** і встановіть для **A message comes in** таке значення:

```text
https://gateway.example.com/webhooks/sms
```

    Використовуйте HTTP `POST`. Типовий локальний шлях — `/webhooks/sms`; змініть `channels.sms.webhookPath`, якщо вам потрібен інший маршрут.

  </Step>

  <Step title="Відкрийте доступ саме до шляху Webhook SMS">
    Ваша загальнодоступна URL-адреса має спрямовувати шлях SMS до процесу Gateway (типовий порт — `18789`). Якщо для локального тестування ви використовуєте Tailscale Funnel, явно відкрийте `/webhooks/sms`:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Голосові виклики та SMS використовують окремі шляхи Webhook. Якщо один номер Twilio обслуговує обидва, залиште обидва маршрути налаштованими у Twilio та у своєму тунелі.

  </Step>

  <Step title="Запустіть Gateway і схваліть першого відправника">

```bash
openclaw gateway
```

Надішліть текстове повідомлення на номер Twilio. Перше повідомлення створить запит на сполучення. Схваліть його:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    Термін дії кодів сполучення завершується через 1 годину.

  </Step>
</Steps>

## Приклади конфігурації

Усі ключі розміщено в `channels.sms` (а для окремих облікових записів — у `channels.sms.accounts.<id>`):

| Ключ                                    | Типове значення | Призначення                                                                 |
| --------------------------------------- | --------------- | --------------------------------------------------------------------------- |
| `enabled`                               | `true`          | Увімкнути або вимкнути канал чи обліковий запис.                             |
| `accountSid`                            | —               | Account SID Twilio (`AC...`).                                                |
| `authToken`                             | —               | Auth Token Twilio; звичайний текстовий рядок або SecretRef.                  |
| `fromNumber`                            | —               | Номер відправника у форматі E.164.                                           |
| `messagingServiceSid`                   | —               | SID Messaging Service (`MG...`), що використовується, коли `fromNumber` не визначено. |
| `defaultTo`                             | —               | Типовий адресат, коли процес надсилання не містить явно заданої цілі.         |
| `webhookPath`                           | `/webhooks/sms` | HTTP-шлях Gateway для вхідних Webhook Twilio.                                |
| `publicWebhookUrl`                      | —               | Загальнодоступна URL-адреса, налаштована у Twilio; потрібна для перевірки підпису. |
| `dangerouslyDisableSignatureValidation` | `false`         | Пропустити перевірки `X-Twilio-Signature`; лише для локального тестування тунелю. |
| `dmPolicy`                              | `"pairing"`     | `pairing`, `allowlist`, `open` або `disabled`.                               |
| `allowFrom`                             | `[]`            | Дозволені номери відправників у форматі E.164 або `"*"` з `dmPolicy: "open"`. |
| `textChunkLimit`                        | `1500`          | Максимальна кількість символів у фрагменті вихідного SMS.                    |
| `accounts`, `defaultAccount`            | —               | Мапа кількох облікових записів та ідентифікатор типового облікового запису.  |

### Файл конфігурації

Використовуйте налаштування через файл конфігурації, якщо потрібно, щоб визначення каналу зберігалося разом із конфігурацією Gateway:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

### Змінні середовища

Змінні середовища застосовуються лише до типового облікового запису; значення конфігурації мають пріоритет над значеннями змінних середовища.

| Змінна                                         | Відповідає                                          |
| ---------------------------------------------- | --------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                           | `accountSid`                                        |
| `TWILIO_AUTH_TOKEN`                            | `authToken`                                         |
| `TWILIO_PHONE_NUMBER` (псевдонім `TWILIO_SMS_FROM`) | `fromNumber`                                   |
| `TWILIO_MESSAGING_SERVICE_SID`                 | `messagingServiceSid`                               |
| `SMS_PUBLIC_WEBHOOK_URL`                       | `publicWebhookUrl`                                  |
| `SMS_WEBHOOK_PATH`                             | `webhookPath`                                       |
| `SMS_ALLOWED_USERS`                            | `allowFrom` (значення, розділені комами)            |
| `SMS_TEXT_CHUNK_LIMIT`                         | `textChunkLimit`                                    |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION` | `dangerouslyDisableSignatureValidation` (`"true"`)  |

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

Потім увімкніть канал у конфігурації:

```json5
{
  channels: {
    sms: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

### Auth Token як SecretRef

`authToken` може бути SecretRef (`source: "env" | "file" | "exec"`). Використовуйте це, коли Gateway має отримувати Auth Token Twilio із середовища виконання секретів OpenClaw замість зберігання конфігурації у вигляді звичайного тексту:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: { source: "env", provider: "default", id: "TWILIO_AUTH_TOKEN" },
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Зазначена змінна середовища або постачальник секретів має бути доступним для середовища виконання Gateway. Після зміни змінних середовища хоста перезапустіть керовані процеси Gateway.

### Відправник Messaging Service

Використовуйте `messagingServiceSid` замість `fromNumber`, коли Twilio має вибирати відправника через Messaging Service:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      messagingServiceSid: "MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Якщо після визначення значень із конфігурації та змінних середовища наявні і `fromNumber`, і `messagingServiceSid`, використовується `fromNumber`.

### Типова ціль вихідних повідомлень

Установіть `defaultTo`, коли автоматизація або надсилання, ініційоване агентом, повинні мати типового адресата, якщо процес надсилання не містить явно заданої цілі:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      defaultTo: "+15557654321",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
    },
  },
}
```

## Керування доступом

`channels.sms.dmPolicy` керує прямим доступом через SMS:

- `pairing` (типово): невідомі відправники отримують код сполучення; схваліть за допомогою `openclaw pairing approve sms <CODE>`.
- `allowlist`: обробляються лише відправники з `allowFrom`. Порожній `allowFrom` відхиляє кожного відправника (Gateway записує попередження під час запуску).
- `open`: для перевірки конфігурації потрібно, щоб `allowFrom` містив `"*"`. Без символу підстановки спілкуватися можуть лише зазначені номери.
- `disabled`: усі вхідні особисті повідомлення відкидаються.

Записи `allowFrom` мають бути номерами телефону у форматі E.164, наприклад `+15551234567`. Префікси `sms:` і `twilio-sms:` приймаються та нормалізуються. Для приватного асистента віддавайте перевагу `dmPolicy: "allowlist"` із явно зазначеними номерами телефону:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "allowlist",
      allowFrom: ["+15557654321"],
    },
  },
}
```

## Надсилання SMS

Коли вибрано канал SMS, як цілі приймаються номери E.164 без префікса або з префіксом `sms:`:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Коли канал вибирається неявно, префікс `twilio-sms:` вибирає цей канал, не перебираючи на себе службовий префікс `sms:`, який iMessage використовує для вибору доставки через SMS оператора для власних цілей:

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI вимагає явно вказувати `--target`. `defaultTo` призначений для автоматизації та шляхів доставлення, ініційованого агентом, де ціль можна визначити з конфігурації каналу.

Відповіді агента у вхідних розмовах через SMS автоматично надсилаються відправнику через налаштованого відправника Twilio.

Вихідні SMS містять звичайний текст. OpenClaw видаляє форматування Markdown, перетворює огороджені блоки коду на звичайний текст, переписує посилання у форматі `мітка (url)` і перед надсиланням через Twilio розділяє довгі відповіді на фрагменти розміром не більше `textChunkLimit` символів (типово 1500).

## Перевірка налаштування

Після запуску Gateway:

1. Переконайтеся, що в журналі Gateway відображається маршрут SMS Webhook.
2. Запустіть перевірку на стороні Twilio (вона перевіряє налаштовані URL-адресу й метод Webhook Twilio, а також нещодавні помилки вхідних повідомлень):

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Надішліть SMS на номер Twilio зі свого телефону.
4. Виконайте `openclaw pairing list sms`.
5. Схваліть код сполучення командою `openclaw pairing approve sms <CODE>`.
6. Надішліть ще одне SMS і переконайтеся, що агент відповідає.

Для тестування лише вихідних повідомлень використовуйте:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### Наскрізний тест із macOS iMessage/SMS

На Mac, який може надсилати операторські SMS через Messages, можна використати `imsg`, щоб керувати стороною відправника, не торкаючись телефона:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

Перше повідомлення має створити запит на сполучення. У відповідь на друге повідомлення має надійти відповідь агента через Twilio.

## Безпека Webhook

За замовчуванням OpenClaw перевіряє `X-Twilio-Signature` за допомогою `publicWebhookUrl` і `authToken`. Частина кінцевої точки в `publicWebhookUrl` має побайтово збігатися з URL-адресою, налаштованою у Twilio, включно зі схемою, хостом, шляхом і рядком запиту. OpenClaw виключає фрагменти [перевизначення з’єднання](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides) Twilio (`#...`) з обчислення підпису, як того вимагає Twilio.

Незалежно від перевірки підпису маршрут Webhook також забезпечує такі обмеження:

- Лише `POST`.
- Обмеження частоти: 30 запитів на хвилину для кожної IP-адреси джерела (понад цей ліміт повертається HTTP 429).
- Значення `AccountSid` у корисному навантаженні має збігатися з налаштованим `accountSid` (інакше повертається HTTP 403).
- Повторно надіслані значення `MessageSid` дедуплікуються протягом 10 хвилин.
- Кеш повторів кожного облікового запису SMS зберігає до 10 000 активних SID повідомлень. Коли всі комірки активні, нові Webhook для цього облікового запису відхиляються за принципом безпечної відмови з HTTP 429 і заголовком `Retry-After`, доки не спливе термін дії найстарішої комірки.
- Тіла запитів розміром понад 32 КБ відхиляються.

За замовчуванням Twilio не повторює запити після HTTP 429 і не документує підтримку `Retry-After`. Перевизначення з’єднання `#rp=4xx` і `#rp=all` вмикають повторні спроби для помилок 4xx, але Twilio обмежує повну транзакцію повторних спроб 15 секундами, тому спроби все одно можуть завершитися до звільнення комірки кешу повторів. Налаштуйте резервну URL-адресу, якщо інший обробник має отримувати повідомлення, доставити які не вдалося; сприймайте 429 як відхилення за принципом безпечної відмови, а не як надійний зворотний тиск.

Лише для локального тестування через тунель можна встановити:

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

Не вимикайте перевірку підпису на загальнодоступному Gateway.

## Конфігурація кількох облікових записів

Використовуйте `accounts`, якщо ви керуєте кількома номерами Twilio:

```json5
{
  channels: {
    sms: {
      accounts: {
        support: {
          enabled: true,
          accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          authToken: "twilio-auth-token",
          fromNumber: "+15551234567",
          publicWebhookUrl: "https://gateway.example.com/webhooks/sms/support",
          webhookPath: "/webhooks/sms/support",
          dmPolicy: "allowlist",
          allowFrom: ["+15557654321"],
        },
      },
    },
  },
}
```

Кожен обліковий запис має використовувати окремий `webhookPath`; Gateway відмовляється реєструвати маршрут Webhook, шлях якого вже належить іншому обліковому запису. Резервні значення середовища `TWILIO_*`/`SMS_*` застосовуються лише до облікового запису за замовчуванням; установіть `defaultAccount`, щоб змінити цей обліковий запис.

## Усунення несправностей

### Twilio повертає 403 або OpenClaw відхиляє Webhook

Перевірте, чи `publicWebhookUrl` точно збігається з URL-адресою, налаштованою у Twilio, включно зі схемою, хостом, шляхом і рядком запиту. Twilio підписує рядок загальнодоступної URL-адреси, тому перезаписування проксі-сервером і альтернативні імена хостів можуть порушити перевірку підпису.

Помилка 403 із повідомленням `Invalid account` означає, що `AccountSid` у вхідному корисному навантаженні не збігається з налаштованим `accountSid`; перевірте, чи Webhook спрямовано до облікового запису, якому належить номер.

### Запит на сполучення не з’являється

Перевірте URL-адресу й метод Webhook **Messaging** для номера Twilio. Він має вказувати на URL-адресу SMS Webhook і використовувати `POST`. Також переконайтеся, що Gateway доступний із загальнодоступного інтернету або через ваш тунель.

Якщо журнал повідомлень Twilio показує помилку `11200`, Twilio прийняв вхідне SMS, але не зміг зв’язатися з вашим Webhook. Перевірте:

- У Twilio **Messaging > A message comes in** вказує на `publicWebhookUrl`.
- Використовується метод `POST`.
- Тунель або зворотний проксі-сервер надає доступ до точного `webhookPath`; для Tailscale Funnel виконайте `tailscale funnel status` і переконайтеся, що `/webhooks/sms` є у списку.
- `publicWebhookUrl` використовує ті самі схему, хост, шлях і рядок запиту, які надсилає Twilio, щоб перевірка підпису могла відтворити підписану URL-адресу.

`openclaw channels status --channel sms --probe` виявляє як невідповідні налаштування Webhook Twilio, так і нещодавні помилки `11200`.

### Не вдається надіслати вихідні повідомлення

Переконайтеся, що визначено `accountSid`, `authToken` і одне зі значень: `fromNumber` або `messagingServiceSid`. Якщо ви використовуєте пробний обліковий запис Twilio, номер одержувача, можливо, потрібно перевірити у Twilio, перш ніж можна буде надсилати вихідні SMS.

### Повідомлення надходять, але агент не відповідає

Перевірте `dmPolicy` і `allowFrom`. За стандартної політики `pairing` відправника потрібно схвалити, перш ніж оброблятимуться звичайні звернення до агента.
