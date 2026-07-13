---
read_when:
    - Вы хотите подключить OpenClaw к SMS через Twilio
    - Вам нужно настроить SMS Webhook или список разрешённых номеров
summary: Настройка канала Twilio SMS, управление доступом и конфигурация Webhook
title: SMS
x-i18n:
    generated_at: "2026-07-13T17:53:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 99a76b2f2d66858f8eb699939084104e620af9bc024053bbe1c1d7350530bff0
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw получает и отправляет SMS через телефонный номер Twilio или Messaging Service. Gateway регистрирует маршрут входящего Webhook (по умолчанию `/webhooks/sms`), по умолчанию проверяет подписи запросов Twilio и отправляет ответы через Messages API Twilio.

Статус: официальный плагин, устанавливается отдельно. Только текст: без MMS и медиафайлов, только личные сообщения.

<CardGroup cols={3}>
  <Card title="Сопряжение" icon="link" href="/ru/channels/pairing">
    Политика по умолчанию для личных сообщений по SMS — сопряжение.
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

- Официальный плагин SMS, установленный с помощью `openclaw plugins install @openclaw/sms`.
- Учетная запись Twilio с телефонным номером, поддерживающим SMS, или Twilio Messaging Service.
- Account SID и Auth Token Twilio.
- Общедоступный URL-адрес HTTPS, ведущий к вашему OpenClaw Gateway.
- Выбранная политика отправителей: `pairing` (по умолчанию) для личного использования, `allowlist` для предварительно одобренных телефонных номеров или `open` только для намеренно общедоступного доступа по SMS.

Один номер Twilio можно использовать и для SMS, и для [голосовых вызовов](/ru/plugins/voice-call), если он поддерживает обе возможности. Webhook SMS и Webhook голосовых вызовов настраиваются в Twilio отдельно и используют разные пути Gateway; на этой странице рассматривается только Webhook SMS.

## Быстрая настройка

<Steps>
  <Step title="Установите плагин">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Создайте или выберите отправителя Twilio">
    В Twilio откройте **Phone Numbers > Manage > Active numbers** и выберите номер, поддерживающий SMS. Сохраните:

    - Account SID, например `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - Телефонный номер отправителя, например `+15551234567`

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

  <Step title="Направьте Twilio на Webhook Gateway">
    В настройках телефонного номера Twilio откройте **Messaging** и задайте для **A message comes in** значение:

```text
https://gateway.example.com/webhooks/sms
```

    Используйте HTTP `POST`. Локальный путь по умолчанию — `/webhooks/sms`; измените `channels.sms.webhookPath`, если вам нужен другой маршрут.

  </Step>

  <Step title="Опубликуйте точный путь Webhook SMS">
    Ваш общедоступный URL-адрес должен направлять путь SMS к процессу Gateway (порт по умолчанию — `18789`). Если для локального тестирования вы используете Tailscale Funnel, явно опубликуйте `/webhooks/sms`:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Голосовые вызовы и SMS используют разные пути Webhook. Если один номер Twilio обрабатывает оба типа, сохраните оба маршрута в настройках Twilio и туннеля.

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

| Ключ                                    | По умолчанию    | Назначение                                                          |
| --------------------------------------- | --------------- | ------------------------------------------------------------------- |
| `enabled`                               | `true`          | Включает или отключает канал либо учетную запись.                   |
| `accountSid`                            | —               | Account SID Twilio (`AC...`).                                       |
| `authToken`                             | —               | Auth Token Twilio; строка с открытым текстом или SecretRef.         |
| `fromNumber`                            | —               | Номер отправителя в формате E.164.                                  |
| `messagingServiceSid`                   | —               | SID Messaging Service (`MG...`), используемый, если `fromNumber` не разрешается. |
| `defaultTo`                             | —               | Получатель по умолчанию, если в процессе отправки не указана явная цель. |
| `webhookPath`                           | `/webhooks/sms` | HTTP-путь Gateway для входящих Webhook Twilio.                      |
| `publicWebhookUrl`                      | —               | Общедоступный URL-адрес, настроенный в Twilio; необходим для проверки подписи. |
| `dangerouslyDisableSignatureValidation` | `false`         | Пропускает проверки `X-Twilio-Signature`; только для локального тестирования туннеля. |
| `dmPolicy`                              | `"pairing"`     | `pairing`, `allowlist`, `open` или `disabled`.                      |
| `allowFrom`                             | `[]`            | Разрешенные номера отправителей в формате E.164 или `"*"` с `dmPolicy: "open"`. |
| `textChunkLimit`                        | `1500`          | Максимальное количество символов в одной части исходящего SMS.     |
| `accounts`, `defaultAccount`            | —               | Карта нескольких учетных записей и идентификатор учетной записи по умолчанию. |

### Файл конфигурации

Используйте настройку через файл конфигурации, если хотите хранить определение канала вместе с конфигурацией Gateway:

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
| `TWILIO_PHONE_NUMBER` (псевдоним `TWILIO_SMS_FROM`) | `fromNumber`                                    |
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

### Auth Token через SecretRef

`authToken` может быть SecretRef (`source: "env" | "file" | "exec"`). Используйте этот вариант, если Gateway должен получать Auth Token Twilio из среды выполнения секретов OpenClaw, а не хранить его в конфигурации открытым текстом:

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

Задайте `defaultTo`, если автоматизация или доставка по инициативе агента должна использовать получателя по умолчанию, когда в процессе отправки не указана явная цель:

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
- `allowlist`: обрабатываются только отправители из `allowFrom`. Пустой `allowFrom` отклоняет всех отправителей (Gateway записывает предупреждение при запуске).
- `open`: проверка конфигурации требует, чтобы `allowFrom` содержал `"*"`. Без подстановочного знака общаться могут только указанные номера.
- `disabled`: все входящие личные сообщения отбрасываются.

Элементы `allowFrom` должны быть телефонными номерами в формате E.164, например `+15551234567`. Префиксы `sms:` и `twilio-sms:` принимаются и нормализуются. Для личного помощника предпочтительно использовать `dmPolicy: "allowlist"` с явно указанными телефонными номерами:

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

При выбранном канале SMS в качестве целей принимаются номера E.164 без префикса или с префиксом `sms:`:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Если канал выбирается неявно, префикс `twilio-sms:` выбирает этот канал, не перехватывая служебный префикс `sms:`, который iMessage использует для выбора доставки SMS через оператора для собственных целей:

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI требует явно указать `--target`. `defaultTo` предназначен для автоматизации и доставки по инициативе агента, когда цель можно определить из конфигурации канала.

Ответы агента во входящих SMS-диалогах автоматически отправляются обратно отправителю через настроенного отправителя Twilio.

SMS выводятся в виде обычного текста. OpenClaw удаляет разметку Markdown, преобразует блоки кода в обычный текст, переписывает ссылки в виде `label (url)` и перед отправкой через Twilio разбивает длинные ответы на части размером не более `textChunkLimit` символов (по умолчанию 1500).

## Проверка настройки

После запуска Gateway:

1. Убедитесь, что в журнале Gateway отображается маршрут Webhook для SMS.
2. Запустите проверку на стороне Twilio (она проверяет настроенные URL и метод Webhook Twilio, а также недавние ошибки входящих запросов):

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

### Сквозное тестирование из iMessage/SMS в macOS

На компьютере Mac, который может отправлять SMS оператора через Messages, можно использовать `imsg` для управления стороной отправителя, не используя телефон:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

Первое сообщение должно создать запрос на сопряжение. В ответ на второе сообщение должен прийти ответ агента через Twilio.

## Безопасность Webhook

По умолчанию OpenClaw проверяет `X-Twilio-Signature` с помощью `publicWebhookUrl` и `authToken`. Часть конечной точки в `publicWebhookUrl` должна побайтно совпадать с URL, настроенным в Twilio, включая схему, хост, путь и строку запроса. В соответствии с требованиями Twilio OpenClaw исключает фрагменты [переопределения подключения](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides) (`#...`) из вычисления подписи.

Независимо от проверки подписи маршрут Webhook также применяет следующие ограничения:

- Только `POST`.
- Лимит неудачных запросов — 300 запросов в минуту для каждой комбинации учётной записи SMS, маршрута Webhook и определённого адреса клиента. Все запросы учитываются в этом лимите, но HTTP 429 возвращается только после того, как запрос не прошёл разбор тела, проверку Twilio или сопоставление AccountSid.
- Ограничение частоты обрабатываемых обратных вызовов — 30 принятых обратных вызовов в минуту для каждой комбинации учётной записи SMS, маршрута Webhook и определённого адреса клиента после успешного прохождения этих проверок (при превышении возвращается HTTP 429). Если проверка подписи отключена, этот лимит 30/мин является максимальной частотой обработки неаутентифицированных запросов.
- Адреса клиентов определяются с помощью общих правил доверенных прокси Gateway. Если `gateway.trustedProxies` содержит обратный прокси, перенаправляющий обратные вызовы Twilio, OpenClaw применяет эти ограничения по переданному адресу клиента; в противном случае используется адрес непосредственного сокет-соединения.
- Значение `AccountSid` в полезной нагрузке должно совпадать с настроенным `accountSid` (иначе возвращается HTTP 403).
- Повторно полученные значения `MessageSid` дедуплицируются в течение 10 минут.
- Кэш повторов каждой учётной записи SMS хранит до 10 000 действующих SID сообщений. Когда все слоты заняты действующими значениями, новые Webhook для этой учётной записи отклоняются с HTTP 429 и заголовком `Retry-After`, пока не истечёт срок действия самого старого слота.
- Тела запросов размером более 32 КБ отклоняются.

По умолчанию Twilio не повторяет запросы при HTTP 429 и не документирует поддержку `Retry-After`. Переопределения подключения `#rp=4xx` и `#rp=all` включают повторы при ошибках 4xx, однако Twilio ограничивает всю транзакцию повторных попыток 15 секундами, поэтому попытки всё равно могут завершиться до освобождения слота кэша повторов. Настройте резервный URL, если неудачные доставки должен принимать другой обработчик; рассматривайте ответ 429 как отказ с закрытием доступа, а не как надёжный механизм обратного давления.

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

Используйте `accounts`, если вы обслуживаете несколько номеров Twilio:

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

Каждая учётная запись должна использовать отдельный `webhookPath`; Gateway отказывается регистрировать маршрут Webhook, путь которого уже принадлежит другой учётной записи. Резервные значения переменных окружения `TWILIO_*`/`SMS_*` применяются только к учётной записи по умолчанию; чтобы выбрать другую учётную запись по умолчанию, задайте `defaultAccount`.

## Устранение неполадок

### Twilio возвращает 403 или OpenClaw отклоняет Webhook

Убедитесь, что `publicWebhookUrl` точно совпадает с URL, настроенным в Twilio, включая схему, хост, путь и строку запроса. Twilio подписывает строку общедоступного URL, поэтому перезапись адреса прокси-сервером и альтернативные имена хоста могут нарушить проверку подписи.

Ответ 403 с `Invalid account` означает, что `AccountSid` во входящей полезной нагрузке не совпадает с настроенным `accountSid`; убедитесь, что Webhook указывает на учётную запись, которой принадлежит номер.

### Запрос на сопряжение не появляется

Проверьте URL и метод Webhook **Messaging** для номера Twilio. Он должен указывать на URL Webhook SMS и использовать `POST`. Также убедитесь, что Gateway доступен из общедоступного интернета или через ваш туннель.

Если в журнале сообщений Twilio отображается ошибка `11200`, Twilio принял входящее SMS, но не смог подключиться к вашему Webhook. Проверьте следующее:

- Параметр Twilio **Messaging > A message comes in** указывает на `publicWebhookUrl`.
- В качестве метода используется `POST`.
- Туннель или обратный прокси предоставляет доступ точно к `webhookPath`; для Tailscale Funnel выполните `tailscale funnel status` и убедитесь, что в списке присутствует `/webhooks/sms`.
- `publicWebhookUrl` использует те же схему, хост, путь и строку запроса, которые отправляет Twilio, чтобы при проверке подписи можно было воспроизвести подписанный URL.

`openclaw channels status --channel sms --probe` показывает как несоответствия в настройках Webhook Twilio, так и недавние ошибки `11200`.

### Не удаётся отправить исходящие сообщения

Убедитесь, что разрешены значения `accountSid`, `authToken` и либо `fromNumber`, либо `messagingServiceSid`. Если вы используете пробную учётную запись Twilio, перед отправкой исходящих SMS может потребоваться подтвердить номер получателя в Twilio.

### Сообщения приходят, но агент не отвечает

Проверьте `dmPolicy` и `allowFrom`. При политике `pairing`, используемой по умолчанию, отправитель должен быть одобрен до обработки обычных обращений к агенту.
