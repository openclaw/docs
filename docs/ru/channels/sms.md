---
read_when:
    - Вы хотите подключить OpenClaw к SMS через Twilio
    - Вам нужно настроить SMS-webhook или список разрешённых номеров
summary: Настройка канала Twilio SMS, управление доступом и конфигурация Webhook
title: SMS
x-i18n:
    generated_at: "2026-07-12T11:12:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae0e0fee978a9837fc75ef7e9122bd06009df0d44de35fe9dff8aab120d5404
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw получает и отправляет SMS через номер телефона Twilio или Messaging Service. Gateway регистрирует маршрут входящего Webhook (по умолчанию `/webhooks/sms`), по умолчанию проверяет подписи запросов Twilio и отправляет ответы через Messages API Twilio.

Статус: официальный Plugin, устанавливается отдельно. Только текст: без MMS и медиаданных, только личные сообщения.

<CardGroup cols={3}>
  <Card title="Сопряжение" icon="link" href="/ru/channels/pairing">
    Политика личных сообщений по умолчанию для SMS — сопряжение.
  </Card>
  <Card title="Безопасность Gateway" icon="shield" href="/ru/gateway/security">
    Проверьте доступность Webhook извне и средства управления доступом отправителей.
  </Card>
  <Card title="Устранение неполадок канала" icon="wrench" href="/ru/channels/troubleshooting">
    Диагностика и инструкции по устранению неполадок для разных каналов.
  </Card>
</CardGroup>

## Перед началом

Вам потребуется:

- Официальный Plugin SMS, установленный с помощью `openclaw plugins install @openclaw/sms`.
- Учетная запись Twilio с номером телефона, поддерживающим SMS, или Twilio Messaging Service.
- Twilio Account SID и Auth Token.
- Общедоступный URL-адрес HTTPS, ведущий к вашему Gateway OpenClaw.
- Выбранная политика отправителей: `pairing` (по умолчанию) для частного использования, `allowlist` для предварительно одобренных номеров телефонов или `open` только для намеренно общедоступного доступа по SMS.

Один номер Twilio может обслуживать и SMS, и [голосовые вызовы](/ru/plugins/voice-call), если поддерживает обе возможности. Webhook SMS и Webhook голосовых вызовов настраиваются в Twilio отдельно и используют разные пути Gateway; на этой странице рассматривается только Webhook SMS.

## Быстрая настройка

<Steps>
  <Step title="Установите Plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Создайте или выберите отправителя Twilio">
    В Twilio откройте **Phone Numbers > Manage > Active numbers** и выберите номер с поддержкой SMS. Сохраните:

    - Account SID, например `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - Номер телефона отправителя, например `+15551234567`

    Если вместо фиксированного номера отправителя вы используете Messaging Service, сохраните SID Messaging Service, например `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="Настройте канал SMS">

Сохраните этот файл как `sms.patch.json5` и замените заполнители:

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

Примените его:

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="Направьте Webhook Twilio на Gateway">
    В настройках номера телефона Twilio откройте **Messaging** и задайте для **A message comes in** следующее значение:

```text
https://gateway.example.com/webhooks/sms
```

    Используйте HTTP `POST`. Локальный путь по умолчанию — `/webhooks/sms`; измените `channels.sms.webhookPath`, если требуется другой маршрут.

  </Step>

  <Step title="Откройте доступ точно к пути Webhook SMS">
    Ваш общедоступный URL-адрес должен направлять путь SMS к процессу Gateway (порт по умолчанию — `18789`). Если для локального тестирования используется Tailscale Funnel, явно откройте `/webhooks/sms`:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Голосовые вызовы и SMS используют разные пути Webhook. Если один номер Twilio обслуживает оба варианта, сохраните оба маршрута в настройках Twilio и вашего туннеля.

  </Step>

  <Step title="Запустите Gateway и одобрите первого отправителя">

```bash
openclaw gateway
```

Отправьте текстовое сообщение на номер Twilio. Первое сообщение создаст запрос на сопряжение. Одобрите его:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    Срок действия кодов сопряжения истекает через 1 час.

  </Step>
</Steps>

## Примеры конфигурации

Все ключи находятся в `channels.sms` (а для отдельных учетных записей — в `channels.sms.accounts.<id>`):

| Ключ                                    | По умолчанию    | Назначение                                                               |
| --------------------------------------- | --------------- | ------------------------------------------------------------------------ |
| `enabled`                               | `true`          | Включает или отключает канал либо учетную запись.                        |
| `accountSid`                            | —               | Twilio Account SID (`AC...`).                                            |
| `authToken`                             | —               | Twilio Auth Token; строка в открытом виде или SecretRef.                  |
| `fromNumber`                            | —               | Номер отправителя в формате E.164.                                       |
| `messagingServiceSid`                   | —               | SID Messaging Service (`MG...`), если `fromNumber` не определен.          |
| `defaultTo`                             | —               | Получатель по умолчанию, если при отправке явно не указана цель.          |
| `webhookPath`                           | `/webhooks/sms` | HTTP-путь Gateway для входящих Webhook Twilio.                            |
| `publicWebhookUrl`                      | —               | Общедоступный URL-адрес, настроенный в Twilio; необходим для проверки подписи. |
| `dangerouslyDisableSignatureValidation` | `false`         | Пропускает проверку `X-Twilio-Signature`; только для тестирования локального туннеля. |
| `dmPolicy`                              | `"pairing"`     | `pairing`, `allowlist`, `open` или `disabled`.                            |
| `allowFrom`                             | `[]`            | Разрешенные номера отправителей в формате E.164 или `"*"` при `dmPolicy: "open"`. |
| `textChunkLimit`                        | `1500`          | Максимальное количество символов в одной части исходящего SMS.           |
| `accounts`, `defaultAccount`            | —               | Карта нескольких учетных записей и идентификатор учетной записи по умолчанию. |

### Файл конфигурации

Используйте настройку через файл конфигурации, если определение канала должно храниться вместе с конфигурацией Gateway:

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

### Переменные окружения

Переменные окружения применяются только к учетной записи по умолчанию; значения конфигурации имеют приоритет над значениями переменных окружения.

| Переменная                                      | Соответствует                                      |
| ----------------------------------------------- | -------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                            | `accountSid`                                       |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                        |
| `TWILIO_PHONE_NUMBER` (псевдоним `TWILIO_SMS_FROM`) | `fromNumber`                                   |
| `TWILIO_MESSAGING_SERVICE_SID`                  | `messagingServiceSid`                              |
| `SMS_PUBLIC_WEBHOOK_URL`                        | `publicWebhookUrl`                                 |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                      |
| `SMS_ALLOWED_USERS`                             | `allowFrom` (через запятую)                        |
| `SMS_TEXT_CHUNK_LIMIT`                          | `textChunkLimit`                                   |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`  | `dangerouslyDisableSignatureValidation` (`"true"`) |

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

Затем включите канал в конфигурации:

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

### Токен аутентификации SecretRef

`authToken` может быть SecretRef (`source: "env" | "file" | "exec"`). Используйте этот вариант, если Gateway должен получать Twilio Auth Token из среды выполнения секретов OpenClaw, а не хранить его в конфигурации в открытом виде:

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

Указанная переменная окружения или поставщик секретов должны быть доступны среде выполнения Gateway. После изменения переменных окружения хоста перезапустите управляемые процессы Gateway.

### Отправитель Messaging Service

Используйте `messagingServiceSid` вместо `fromNumber`, если Twilio должен выбирать отправителя через Messaging Service:

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

Если после разрешения значений конфигурации и переменных окружения присутствуют и `fromNumber`, и `messagingServiceSid`, используется `fromNumber`.

### Исходящий получатель по умолчанию

Задайте `defaultTo`, если для автоматизации или доставки, инициированной агентом, требуется получатель по умолчанию, когда при отправке явно не указана цель:

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

## Управление доступом

`channels.sms.dmPolicy` управляет прямым доступом по SMS:

- `pairing` (по умолчанию): неизвестные отправители получают код сопряжения; одобрите его с помощью `openclaw pairing approve sms <CODE>`.
- `allowlist`: обрабатываются только отправители из `allowFrom`. Пустой список `allowFrom` отклоняет всех отправителей (Gateway записывает предупреждение при запуске).
- `open`: проверка конфигурации требует, чтобы `allowFrom` содержал `"*"`. Без подстановочного знака общаться могут только указанные номера.
- `disabled`: все входящие личные сообщения отбрасываются.

Записи `allowFrom` должны быть номерами телефонов в формате E.164, например `+15551234567`. Префиксы `sms:` и `twilio-sms:` принимаются и нормализуются. Для частного помощника предпочтительно использовать `dmPolicy: "allowlist"` с явно указанными номерами телефонов:

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

## Отправка SMS

Если выбран канал SMS, в качестве получателей принимаются номера E.164 без префикса или с префиксом `sms:`:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Если канал выбирается неявно, префикс `twilio-sms:` выбирает этот канал, не перехватывая служебный префикс `sms:`, который iMessage использует для выбора доставки через SMS оператора для собственных получателей:

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI требует явно указать `--target`. `defaultTo` предназначен для автоматизации и путей доставки, инициированных агентом, где получатель может быть определен из конфигурации канала.

Ответы агента во входящих SMS-разговорах автоматически отправляются обратно отправителю через настроенного отправителя Twilio.

Вывод SMS представляет собой обычный текст. OpenClaw удаляет разметку Markdown, преобразует блоки кода с ограждением в обычный текст, переписывает ссылки в виде `метка (url)` и перед отправкой через Twilio разделяет длинные ответы на части не более `textChunkLimit` символов каждая (по умолчанию 1500).

## Проверка настройки

После запуска Gateway:

1. Убедитесь, что в журнале Gateway отображается маршрут SMS-Webhook.
2. Выполните проверку на стороне Twilio (проверяются настроенные URL и метод Webhook Twilio, а также недавние ошибки входящих сообщений):

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Отправьте SMS на номер Twilio со своего телефона.
4. Выполните `openclaw pairing list sms`.
5. Подтвердите код сопряжения с помощью `openclaw pairing approve sms <CODE>`.
6. Отправьте ещё одно SMS и убедитесь, что агент отвечает.

Для проверки только исходящих сообщений используйте:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### Сквозное тестирование через iMessage/SMS в macOS

На компьютере Mac, который может отправлять операторские SMS через приложение «Сообщения», можно использовать `imsg` для управления стороной отправителя, не прикасаясь к телефону:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

Первое сообщение должно создать запрос на сопряжение. В ответ на второе сообщение через Twilio должен прийти ответ агента.

## Безопасность Webhook

По умолчанию OpenClaw проверяет `X-Twilio-Signature` с помощью `publicWebhookUrl` и `authToken`. Часть `publicWebhookUrl`, относящаяся к конечной точке, должна побайтово совпадать с URL, настроенным в Twilio, включая схему, хост, путь и строку запроса. OpenClaw исключает из вычисления подписи фрагменты [переопределения подключения](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides) Twilio (`#...`), как того требует Twilio.

Маршрут Webhook также применяет следующие ограничения независимо от проверки подписи:

- Только `POST`.
- Ограничение частоты: 30 запросов в минуту для каждого IP-адреса источника (при превышении возвращается HTTP 429).
- Значение `AccountSid` в полезной нагрузке должно совпадать с настроенным `accountSid` (иначе возвращается HTTP 403).
- Повторно переданные значения `MessageSid` дедуплицируются в течение 10 минут.
- Кэш защиты от повторов каждой учётной записи SMS хранит до 10 000 активных SID сообщений. Если все ячейки заняты активными значениями, новые Webhook для этой учётной записи отклоняются в закрытом режиме с HTTP 429 и заголовком `Retry-After`, пока не истечёт срок действия самой старой ячейки.
- Тела запросов размером более 32 КБ отклоняются.

По умолчанию Twilio не повторяет запросы после HTTP 429 и не заявляет о поддержке `Retry-After`. Переопределения подключения `#rp=4xx` и `#rp=all` включают повторные попытки при ответах 4xx, однако Twilio ограничивает всю транзакцию повторных попыток 15 секундами, поэтому они могут завершиться до освобождения ячейки кэша защиты от повторов. Настройте резервный URL, если другой обработчик должен принимать сообщения, доставить которые не удалось; рассматривайте ответ 429 как отклонение в закрытом режиме, а не как надёжный механизм обратного давления.

Только для локального тестирования через туннель можно задать:

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

Не отключайте проверку подписи на общедоступном Gateway.

## Конфигурация нескольких учётных записей

Используйте `accounts`, если вы управляете несколькими номерами Twilio:

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

Каждая учётная запись должна использовать уникальный `webhookPath`; Gateway отказывается регистрировать маршрут Webhook, путь которого уже принадлежит другой учётной записи. Резервные значения из переменных окружения `TWILIO_*`/`SMS_*` применяются только к учётной записи по умолчанию; чтобы выбрать другую учётную запись по умолчанию, задайте `defaultAccount`.

## Устранение неполадок

### Twilio возвращает 403 или OpenClaw отклоняет Webhook

Убедитесь, что `publicWebhookUrl` в точности совпадает с URL, настроенным в Twilio, включая схему, хост, путь и строку запроса. Twilio подписывает строку общедоступного URL, поэтому перезапись адреса прокси-сервером и альтернативные имена хоста могут нарушить проверку подписи.

Ответ 403 с сообщением `Invalid account` означает, что `AccountSid` во входящей полезной нагрузке не совпадает с настроенным `accountSid`; убедитесь, что Webhook указывает на учётную запись, которой принадлежит номер.

### Запрос на сопряжение не появляется

Проверьте URL и метод Webhook **Messaging** для номера Twilio. Он должен указывать на URL SMS-Webhook и использовать `POST`. Также убедитесь, что Gateway доступен из общедоступного интернета или через ваш туннель.

Если в журнале сообщений Twilio отображается ошибка `11200`, это означает, что Twilio принял входящее SMS, но не смог обратиться к вашему Webhook. Проверьте следующее:

- Параметр Twilio **Messaging > A message comes in** указывает на `publicWebhookUrl`.
- Используется метод `POST`.
- Туннель или обратный прокси-сервер предоставляет доступ к точному пути `webhookPath`; для Tailscale Funnel выполните `tailscale funnel status` и убедитесь, что в списке присутствует `/webhooks/sms`.
- В `publicWebhookUrl` используются те же схема, хост, путь и строка запроса, которые отправляет Twilio, чтобы при проверке подписи можно было воспроизвести подписанный URL.

Команда `openclaw channels status --channel sms --probe` показывает как несоответствия в настройках Webhook Twilio, так и недавние ошибки `11200`.

### Не удаётся отправить исходящие сообщения

Убедитесь, что разрешены значения `accountSid`, `authToken`, а также `fromNumber` или `messagingServiceSid`. Если вы используете пробную учётную запись Twilio, перед отправкой исходящих SMS может потребоваться подтвердить номер получателя в Twilio.

### Сообщения приходят, но агент не отвечает

Проверьте `dmPolicy` и `allowFrom`. При политике по умолчанию `pairing` отправитель должен быть подтверждён до обработки обычных обращений к агенту.
