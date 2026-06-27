---
read_when:
    - Ви хочете підключити OpenClaw до SMS через Twilio
    - Потрібно налаштувати SMS Webhook або список дозволених
summary: Налаштування каналу SMS Twilio, контроль доступу та конфігурація Webhook
title: SMS
x-i18n:
    generated_at: "2026-06-27T17:13:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c384fa3374450aa3facc749791b5d59165d9daf0920ea5438ad412522166f52
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw може отримувати й надсилати SMS через телефонний номер Twilio або Messaging Service. Gateway реєструє маршрут вхідного Webhook, за замовчуванням перевіряє підписи запитів Twilio та надсилає відповіді назад через Messages API Twilio.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Типова політика DM для SMS — сполучення.
  </Card>
  <Card title="Безпека Gateway" icon="shield" href="/uk/gateway/security">
    Перегляньте доступність Webhook і засоби контролю доступу відправників.
  </Card>
  <Card title="Усунення несправностей каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та інструкції з виправлення.
  </Card>
</CardGroup>

## Перед початком

Вам потрібно:

- Офіційний Plugin SMS, установлений за допомогою `openclaw plugins install @openclaw/sms`.
- Обліковий запис Twilio з телефонним номером, що підтримує SMS, або Twilio Messaging Service.
- Twilio Account SID і Auth Token.
- Публічна HTTPS-URL-адреса, яка веде до вашого OpenClaw Gateway.
- Вибір політики відправників: `pairing` для приватного використання, `allowlist` для попередньо схвалених телефонних номерів або `open` лише для навмисно публічного доступу через SMS.

Використовуйте один номер Twilio і для SMS, і для голосових викликів, якщо номер підтримує обидві можливості. Налаштуйте SMS Webhook і голосовий Webhook окремо в Twilio; ця сторінка охоплює лише SMS Webhook.

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
    - Телефонний номер відправника, наприклад `+15551234567`

    Якщо замість фіксованого номера відправника ви використовуєте Messaging Service, збережіть Messaging Service SID, наприклад `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

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

Застосуйте його:

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="Спрямуйте Twilio на Webhook Gateway">
    У налаштуваннях телефонного номера Twilio відкрийте **Messaging** і встановіть **A message comes in** на:

```text
https://gateway.example.com/webhooks/sms
```

    Використовуйте HTTP `POST`. Типовий локальний шлях — `/webhooks/sms`; змініть `channels.sms.webhookPath`, якщо потрібен інший маршрут.

  </Step>

  <Step title="Відкрийте точний шлях SMS Webhook">
    Ваша публічна URL-адреса має маршрутизувати шлях SMS до процесу Gateway. Якщо для локального тестування ви використовуєте Tailscale Funnel, явно відкрийте `/webhooks/sms`:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Голосові виклики й SMS використовують окремі шляхи Webhook. Якщо той самий номер Twilio обробляє обидва, збережіть обидва маршрути налаштованими в Twilio і у вашому тунелі.

  </Step>

  <Step title="Запустіть Gateway і схваліть першого відправника">

```bash
openclaw gateway
```

Надішліть текстове повідомлення на номер Twilio. Перше повідомлення створює запит на сполучення. Схваліть його:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    Коди сполучення спливають через 1 годину.

  </Step>
</Steps>

## Приклади конфігурації

### Файл конфігурації

Використовуйте налаштування через файл конфігурації, коли хочете, щоб визначення каналу передавалося разом із конфігурацією Gateway:

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

Використовуйте налаштування через env для розгортань з одним обліковим записом, де секрети надходять із середовища хоста:

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

`TWILIO_SMS_FROM` приймається як псевдонім для `TWILIO_PHONE_NUMBER`. Використовуйте `TWILIO_MESSAGING_SERVICE_SID` замість відправника за телефонним номером, коли Twilio має вибирати відправника з Messaging Service.

### Auth Token через SecretRef

`authToken` може бути SecretRef. Використовуйте це, коли Gateway має отримувати Twilio Auth Token із runtime секретів OpenClaw замість збереження конфігурації у відкритому тексті:

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

Зазначена змінна середовища або постачальник секретів має бути видимим для runtime Gateway. Перезапустіть керовані процеси Gateway після зміни змінних середовища хоста.

### Приватний номер лише зі списком дозволених

Використовуйте `allowlist`, коли лише відомі телефонні номери мають мати змогу спілкуватися з агентом:

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

Якщо після розв’язання конфігурації та env присутні і `fromNumber`, і `messagingServiceSid`, використовується `fromNumber`.

### Типова ціль вихідних повідомлень

Установіть `defaultTo`, коли автоматизація або доставка, ініційована агентом, повинна мати типове місце призначення, якщо потік надсилання не вказує явну ціль:

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

## Контроль доступу

`channels.sms.dmPolicy` керує прямим доступом через SMS:

- `pairing` (типово)
- `allowlist` (потребує щонайменше одного відправника в `allowFrom`)
- `open` (потребує, щоб `allowFrom` містив `"*"`)
- `disabled`

Записи `allowFrom` мають бути телефонними номерами E.164, як-от `+15551234567`. Префікси `sms:` приймаються та нормалізуються. Для приватного помічника віддавайте перевагу `dmPolicy: "allowlist"` з явними телефонними номерами.

## Надсилання SMS

Цілі вихідних SMS використовують службовий префікс `sms:` з вибраним каналом SMS:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Коли вибір каналу неявний, `twilio-sms:+15551234567` вибирає цей канал, не перебираючи на себе наявний службовий префікс `sms:`, що належить каналу й використовується iMessage.

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI потребує явного `--target`. `defaultTo` призначений для автоматизації та шляхів доставки, ініційованих агентом, де ціль можна розв’язати з конфігурації каналу.

Відповіді агента з вхідних SMS-розмов автоматично повертаються відправнику через налаштованого відправника Twilio.

Вивід SMS — це звичайний текст. OpenClaw прибирає markdown, вирівнює fenced code blocks, зберігає читабельні посилання та розбиває довгі відповіді на частини перед надсиланням через Twilio.

## Перевірка налаштування

Після запуску Gateway:

1. Переконайтеся, що журнал Gateway показує маршрут SMS Webhook.
2. Запустіть перевірку з боку Twilio:

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Надішліть SMS на номер Twilio зі свого телефона.
4. Запустіть `openclaw pairing list sms`.
5. Схваліть код сполучення за допомогою `openclaw pairing approve sms <CODE>`.
6. Надішліть ще одне SMS і переконайтеся, що агент відповідає.

Для тестування лише вихідних повідомлень використовуйте:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### Наскрізний тест з macOS iMessage/SMS

На Mac, який може надсилати операторські SMS через Messages, можна використовувати `imsg`, щоб керувати стороною відправника, не торкаючись телефона:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

Перше повідомлення має створити запит на сполучення. Друге повідомлення має отримати відповідь агента через Twilio.

## Безпека Webhook

За замовчуванням OpenClaw перевіряє `X-Twilio-Signature` за допомогою `publicWebhookUrl` і `authToken`. Тримайте `publicWebhookUrl` побайтово узгодженою з URL-адресою, налаштованою в Twilio, включно зі схемою, хостом, шляхом і рядком запиту.

Лише для тестування локального тунелю можна встановити:

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

## Конфігурація з кількома обліковими записами

Використовуйте `accounts`, коли працюєте з кількома номерами Twilio:

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

Кожен обліковий запис має використовувати окремий `webhookPath`.

## Усунення несправностей

### Twilio повертає 403 або OpenClaw відхиляє Webhook

Перевірте, що `publicWebhookUrl` точно збігається з URL-адресою, налаштованою в Twilio, включно зі схемою, хостом, шляхом і рядком запиту. Twilio підписує рядок публічної URL-адреси, тому переписування проксі та альтернативні імена хостів можуть порушити перевірку підпису.

### Запит на сполучення не з’являється

Перевірте URL-адресу та метод Webhook **Messaging** для номера Twilio. Він має вказувати на URL-адресу SMS Webhook і використовувати `POST`. Також переконайтеся, що Gateway доступний із публічного інтернету або через ваш тунель.

Якщо журнал повідомлень Twilio показує помилку `11200`, Twilio прийняв вхідне SMS, але не зміг дістатися до вашого Webhook. Перевірте:

- Twilio **Messaging > A message comes in** вказує на `publicWebhookUrl`.
- Метод — `POST`.
- Тунель або зворотний проксі відкриває точний `webhookPath`; для Tailscale Funnel запустіть `tailscale funnel status` і переконайтеся, що `/webhooks/sms` є у списку.
- `publicWebhookUrl` використовує ту саму схему, хост, шлях і рядок запиту, які надсилає Twilio, щоб перевірка підпису могла відтворити підписану URL-адресу.

### Вихідні надсилання не вдаються

Переконайтеся, що `accountSid`, `authToken` і або `fromNumber`, або `messagingServiceSid` розв’язані. Якщо ви використовуєте пробний обліковий запис Twilio, можливо, номер призначення потрібно перевірити в Twilio, перш ніж вихідні SMS надсилатимуться.

### Повідомлення надходять, але агент не відповідає

Перевірте `dmPolicy` і `allowFrom`. За стандартної політики `pairing` відправника потрібно схвалити, перш ніж оброблятимуться звичайні ходи агента.
