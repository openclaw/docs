---
read_when:
    - Ви хочете підключити OpenClaw до SMS через Twilio
    - Потрібно налаштувати SMS Webhook або список дозволених номерів
summary: Налаштування каналу Twilio SMS, керування доступом і конфігурація webhook
title: SMS
x-i18n:
    generated_at: "2026-07-16T17:42:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 99a76b2f2d66858f8eb699939084104e620af9bc024053bbe1c1d7350530bff0
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
    Перегляньте доступність Webhook і засоби керування доступом відправників.
  </Card>
  <Card title="Усунення несправностей каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та інструкції з відновлення.
  </Card>
</CardGroup>

## Перед початком

Потрібні:

- Офіційний Plugin SMS, установлений за допомогою `openclaw plugins install @openclaw/sms`.
- Обліковий запис Twilio з номером телефону, що підтримує SMS, або Twilio Messaging Service.
- Account SID і Auth Token Twilio.
- Загальнодоступна HTTPS-адреса, за якою можна звернутися до вашого OpenClaw Gateway.
- Вибір політики відправників: `pairing` (типово) для приватного використання, `allowlist` для попередньо схвалених номерів телефону або `open` лише для свідомо відкритого доступу через SMS.

Один номер Twilio може обслуговувати і SMS, і [голосові виклики](/uk/plugins/voice-call), якщо підтримує обидві можливості. Webhook SMS і голосовий Webhook налаштовуються у Twilio окремо та використовують окремі шляхи Gateway; на цій сторінці описано лише Webhook SMS.

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

    Якщо замість фіксованого номера відправника використовується Messaging Service, збережіть SID Messaging Service, наприклад `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="Налаштуйте канал SMS">

Збережіть це як `sms.patch.json5` і змініть заповнювачі:

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

Застосуйте:

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="Спрямуйте Twilio на Webhook Gateway">
    У налаштуваннях номера телефону Twilio відкрийте **Messaging** і задайте для **A message comes in** таке значення:

```text
https://gateway.example.com/webhooks/sms
```

    Використовуйте HTTP `POST`. Типовий локальний шлях — `/webhooks/sms`; змініть `channels.sms.webhookPath`, якщо потрібен інший маршрут.

  </Step>

  <Step title="Відкрийте доступ до точного шляху Webhook SMS">
    Ваша загальнодоступна URL-адреса має спрямовувати шлях SMS до процесу Gateway (типовий порт `18789`). Якщо для локального тестування використовується Tailscale Funnel, явно відкрийте `/webhooks/sms`:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Голосові виклики й SMS використовують окремі шляхи Webhook. Якщо той самий номер Twilio обробляє обидва типи, збережіть налаштування обох маршрутів у Twilio та у своєму тунелі.

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

    Коди сполучення втрачають чинність через 1 годину.

  </Step>
</Steps>

## Приклади конфігурації

Усі ключі розташовані в `channels.sms` (а для окремого облікового запису — у `channels.sms.accounts.<id>`):

| Ключ                                    | Типове значення  | Призначення                                                         |
| --------------------------------------- | --------------- | ------------------------------------------------------------------- |
| `enabled`                               | `true`          | Увімкнути або вимкнути канал чи обліковий запис.                    |
| `accountSid`                            | —               | Account SID Twilio (`AC...`).                                       |
| `authToken`                             | —               | Auth Token Twilio; звичайний текстовий рядок або SecretRef.         |
| `fromNumber`                            | —               | Номер відправника у форматі E.164.                                  |
| `messagingServiceSid`                   | —               | SID Messaging Service (`MG...`), що використовується, коли не визначено `fromNumber`. |
| `defaultTo`                             | —               | Типовий адресат, коли в потоці надсилання не вказано явну ціль.      |
| `webhookPath`                           | `/webhooks/sms` | HTTP-шлях Gateway для вхідних Webhook Twilio.                       |
| `publicWebhookUrl`                      | —               | Загальнодоступна URL-адреса, налаштована у Twilio; потрібна для перевірки підпису. |
| `dangerouslyDisableSignatureValidation` | `false`         | Пропустити перевірки `X-Twilio-Signature`; лише для тестування локального тунелю. |
| `dmPolicy`                              | `"pairing"`     | `pairing`, `allowlist`, `open` або `disabled`.                      |
| `allowFrom`                             | `[]`            | Дозволені номери відправників у форматі E.164 або `"*"` разом із `dmPolicy: "open"`. |
| `textChunkLimit`                        | `1500`          | Максимальна кількість символів в одному вихідному фрагменті SMS.    |
| `accounts`, `defaultAccount`            | —               | Мапа кількох облікових записів та ідентифікатор типового облікового запису. |

### Файл конфігурації

Використовуйте налаштування через файл конфігурації, якщо визначення каналу має зберігатися разом із конфігурацією Gateway:

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

Змінні середовища застосовуються лише до типового облікового запису; значення конфігурації мають вищий пріоритет за значення змінних середовища.

| Змінна                                          | Відповідає                                          |
| ----------------------------------------------- | -------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                            | `accountSid`                                       |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                        |
| `TWILIO_PHONE_NUMBER` (псевдонім `TWILIO_SMS_FROM`) | `fromNumber`                                       |
| `TWILIO_MESSAGING_SERVICE_SID`                  | `messagingServiceSid`                              |
| `SMS_PUBLIC_WEBHOOK_URL`                        | `publicWebhookUrl`                                 |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                      |
| `SMS_ALLOWED_USERS`                             | `allowFrom` (через кому)                           |
| `SMS_TEXT_CHUNK_LIMIT`                          | `textChunkLimit`                                   |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`  | `dangerouslyDisableSignatureValidation` (`"true"`) |

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

### Auth Token через SecretRef

`authToken` може бути SecretRef (`source: "env" | "file" | "exec"`). Використовуйте це, коли Gateway має отримувати Auth Token Twilio зі сховища секретів OpenClaw, а не зберігати його у конфігурації як звичайний текст:

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

Змінна середовища або постачальник секретів, на які є посилання, мають бути доступні середовищу виконання Gateway. Після зміни змінних середовища хоста перезапустіть керовані процеси Gateway.

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

### Типовий адресат вихідних повідомлень

Задайте `defaultTo`, якщо для автоматизації або доставлення, ініційованого агентом, потрібен типовий адресат, коли в потоці надсилання не вказано явну ціль:

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

- `pairing` (типово): невідомі відправники отримують код сполучення; схваліть його за допомогою `openclaw pairing approve sms <CODE>`.
- `allowlist`: обробляються лише відправники з `allowFrom`. Порожній `allowFrom` відхиляє всіх відправників (Gateway записує попередження під час запуску).
- `open`: для перевірки конфігурації потрібно, щоб `allowFrom` містив `"*"`. Без символу підстановки спілкуватися можуть лише вказані номери.
- `disabled`: усі вхідні особисті повідомлення відкидаються.

Записи `allowFrom` мають бути номерами телефону у форматі E.164, як-от `+15551234567`. Префікси `sms:` і `twilio-sms:` приймаються та нормалізуються. Для приватного помічника віддавайте перевагу `dmPolicy: "allowlist"` із явно вказаними номерами телефону:

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

Коли вибрано канал SMS, як цілі можна використовувати номери у форматі E.164 без префікса або з префіксом `sms:`:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Коли канал вибирається неявно, префікс `twilio-sms:` вибирає цей канал, не перехоплюючи службовий префікс `sms:`, який iMessage використовує для вибору доставлення через SMS оператора для власних цілей:

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI вимагає явного значення `--target`. `defaultTo` призначено для автоматизації та шляхів доставлення, ініційованого агентом, у яких ціль можна визначити з конфігурації каналу.

Відповіді агента у вхідних SMS-розмовах автоматично надсилаються відправнику через налаштованого відправника Twilio.

Вихідні SMS мають формат звичайного тексту. OpenClaw вилучає розмітку Markdown, перетворює огороджені блоки коду на звичайний текст, переписує посилання як `label (url)` і перед надсиланням через Twilio розділяє довгі відповіді на частини щонайбільше по `textChunkLimit` символів (типово 1500).

## Перевірка налаштування

Після запуску Gateway:

1. Переконайтеся, що в журналі Gateway відображається маршрут SMS Webhook.
2. Запустіть перевірку на стороні Twilio (перевіряє налаштовані URL-адресу й метод Webhook Twilio, а також нещодавні помилки вхідних запитів):

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Надішліть SMS зі свого телефона на номер Twilio.
4. Виконайте `openclaw pairing list sms`.
5. Підтвердьте код спарювання за допомогою `openclaw pairing approve sms <CODE>`.
6. Надішліть ще одне SMS і переконайтеся, що агент відповідає.

Для тестування лише вихідних повідомлень використовуйте:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### Наскрізне тестування з macOS iMessage/SMS

На Mac, який може надсилати операторські SMS через Messages, можна використати `imsg`, щоб керувати стороною відправника, не торкаючись телефона:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

Перше повідомлення має створити запит на спарювання. У відповідь на друге повідомлення має надійти відповідь агента через Twilio.

## Безпека Webhook

Типово OpenClaw перевіряє `X-Twilio-Signature` за допомогою `publicWebhookUrl` і `authToken`. Частина кінцевої точки в `publicWebhookUrl` має побайтово збігатися з URL-адресою, налаштованою у Twilio, включно зі схемою, хостом, шляхом і рядком запиту. OpenClaw виключає фрагменти [перевизначення з’єднання](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides) Twilio (`#...`) з обчислення підпису, як того вимагає Twilio.

Маршрут Webhook також незалежно від перевірки підпису забезпечує:

- Лише `POST`.
- Ліміт невдалих запитів — 300 запитів на хвилину для кожного SMS-облікового запису, маршруту Webhook і визначеної адреси клієнта. Усі запити зараховуються до цього ліміту, але HTTP 429 застосовується лише після того, як запит не проходить розбір тіла, перевірку Twilio або зіставлення AccountSid.
- Обмеження частоти придатних до передавання зворотних викликів — 30 прийнятих зворотних викликів на хвилину для кожного SMS-облікового запису, маршруту Webhook і визначеної адреси клієнта після проходження цих перевірок (HTTP 429 у разі перевищення). Якщо перевірку підпису вимкнено, цей ліміт 30/хв є межею передавання без автентифікації.
- Адреси клієнтів визначаються за спільними правилами довірених проксі Gateway. Якщо `gateway.trustedProxies` містить зворотний проксі, який пересилає зворотні виклики Twilio, OpenClaw прив’язує ці ліміти до пересланої адреси клієнта; інакше використовується безпосередня адреса сокета.
- Значення `AccountSid` у корисному навантаженні має відповідати налаштованому `accountSid` (інакше HTTP 403).
- Повторно відтворені значення `MessageSid` дедуплікуються протягом 10 хвилин.
- Кеш повторного відтворення кожного SMS-облікового запису зберігає до 10 000 активних SID повідомлень. Коли всі комірки активні, нові Webhook для цього облікового запису блокуються з HTTP 429 і заголовком `Retry-After`, доки не завершиться строк дії найстарішої комірки.
- Тіла запитів розміром понад 32 КБ відхиляються.

Типово Twilio не повторює запити після HTTP 429 і не документує підтримку `Retry-After`. Перевизначення з’єднання `#rp=4xx` і `#rp=all` вмикають повторні спроби для відповідей 4xx, але Twilio обмежує повну транзакцію повторних спроб 15 секундами, тому вони все одно можуть завершитися до закінчення строку дії комірки кешу повторного відтворення. Налаштуйте резервну URL-адресу, якщо інший обробник має отримувати невдалі доставки; вважайте 429 блокувальним відхиленням, а не надійним механізмом зворотного тиску.

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

Не використовуйте вимкнену перевірку підпису на публічному Gateway.

## Конфігурація кількох облікових записів

Використовуйте `accounts`, якщо працюєте з кількома номерами Twilio:

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

Кожен обліковий запис має використовувати окремий `webhookPath`; Gateway відмовляється реєструвати маршрут Webhook, шлях якого вже належить іншому обліковому запису. Резервні значення середовища `TWILIO_*`/`SMS_*` застосовуються лише до типового облікового запису; установіть `defaultAccount`, щоб вибрати інший типовий обліковий запис.

## Усунення несправностей

### Twilio повертає 403 або OpenClaw відхиляє Webhook

Переконайтеся, що `publicWebhookUrl` точно збігається з URL-адресою, налаштованою у Twilio, включно зі схемою, хостом, шляхом і рядком запиту. Twilio підписує рядок публічної URL-адреси, тому перезаписування проксі та альтернативні імена хостів можуть порушити перевірку підпису.

Відповідь 403 із `Invalid account` означає, що `AccountSid` у вхідному корисному навантаженні не відповідає налаштованому `accountSid`; переконайтеся, що Webhook спрямовано на обліковий запис, якому належить номер.

### Запит на спарювання не з’являється

Перевірте URL-адресу й метод Webhook **Messaging** для номера Twilio. Він має вказувати на URL-адресу SMS Webhook і використовувати `POST`. Також переконайтеся, що Gateway доступний із загальнодоступного інтернету або через ваш тунель.

Якщо в журналі повідомлень Twilio відображається помилка `11200`, Twilio прийняв вхідне SMS, але не зміг звернутися до вашого Webhook. Перевірте:

- У Twilio **Messaging > A message comes in** указує на `publicWebhookUrl`.
- Метод — `POST`.
- Тунель або зворотний проксі надає доступ до точного `webhookPath`; для Tailscale Funnel виконайте `tailscale funnel status` і переконайтеся, що `/webhooks/sms` є в списку.
- `publicWebhookUrl` використовує ту саму схему, хост, шлях і рядок запиту, які надсилає Twilio, щоб перевірка підпису могла відтворити підписану URL-адресу.

`openclaw channels status --channel sms --probe` показує як невідповідні налаштування Webhook Twilio, так і нещодавні помилки `11200`.

### Не вдається надіслати вихідні повідомлення

Переконайтеся, що визначено `accountSid`, `authToken` і одне зі значень: `fromNumber` або `messagingServiceSid`. Якщо використовується пробний обліковий запис Twilio, номер одержувача може потребувати підтвердження у Twilio, перш ніж вихідні SMS можна буде надсилати.

### Повідомлення надходять, але агент не відповідає

Перевірте `dmPolicy` і `allowFrom`. За типової політики `pairing` відправника потрібно схвалити, перш ніж оброблятимуться звичайні звернення до агента.
