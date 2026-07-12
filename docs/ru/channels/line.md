---
read_when:
    - Вы хотите подключить OpenClaw к LINE
    - Вам нужно настроить Webhook LINE и учетные данные
    - Вам нужны параметры сообщений, специфичные для LINE
summary: Настройка, конфигурация и использование Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-07-12T11:10:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee5931c2bfca4a67a8b390f300907cd31a074988b10c6c0540444cff0bfde334
    source_path: channels/line.md
    workflow: 16
---

LINE подключается к OpenClaw через LINE Messaging API. Plugin работает на Gateway как
приёмник Webhook и использует токен доступа к каналу и секрет канала для
аутентификации.

Статус: официальный Plugin, устанавливаемый отдельно. Поддерживаются личные сообщения,
групповые чаты, медиафайлы, местоположения, Flex-сообщения, шаблонные сообщения и быстрые ответы.
Реакции и ветки не поддерживаются.

## Установка

Установите LINE перед настройкой канала:

```bash
openclaw plugins install @openclaw/line
```

Локальная рабочая копия (при запуске из git-репозитория):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Настройка

1. Создайте учётную запись LINE Developers и откройте Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Создайте (или выберите) Provider и добавьте канал **Messaging API**.
3. Скопируйте **Channel access token** и **Channel secret** из настроек канала.
4. Включите **Use webhook** в настройках Messaging API.
5. Укажите в качестве URL вебхука конечную точку Gateway (требуется HTTPS):

```text
https://gateway-host/line/webhook
```

Gateway отвечает на проверку вебхука LINE (GET) и немедленно подтверждает подписанные
входящие события (POST) после проверки подписи и полезной нагрузки; обработка агентом
продолжается асинхронно.
Если нужен пользовательский путь, задайте `channels.line.webhookPath` или
`channels.line.accounts.<id>.webhookPath` и соответствующим образом обновите URL.

Примечания по безопасности:

- Проверка подписи LINE зависит от тела запроса (HMAC по необработанному телу), поэтому OpenClaw применяет строгий лимит тела до аутентификации (64 КБ) и тайм-аут чтения перед проверкой.
- OpenClaw обрабатывает события вебхука из проверенных необработанных байтов запроса. Значения `req.body`, преобразованные вышестоящим промежуточным ПО, игнорируются для сохранения целостности подписи.

## Конфигурация

Минимальная конфигурация:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Конфигурация для общедоступных личных сообщений:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

Переменные окружения (только для учётной записи по умолчанию):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Файлы токена и секрета:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` и `secretFile` должны указывать на обычные файлы. Символические ссылки отклоняются.
Значения, заданные непосредственно в конфигурации, имеют приоритет над файлами; переменные окружения используются в последнюю очередь для учётной записи по умолчанию.

Несколько учётных записей:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Управление доступом

Для личных сообщений по умолчанию используется сопряжение. Неизвестные отправители получают код
сопряжения, а их сообщения игнорируются до подтверждения:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Списки разрешённых отправителей и политики:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (по умолчанию `pairing`)
- `channels.line.allowFrom`: разрешённые идентификаторы пользователей LINE для личных сообщений; для `dmPolicy: "open"` требуется `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled` (по умолчанию `allowlist`)
- `channels.line.groupAllowFrom`: разрешённые идентификаторы пользователей LINE для групп
- Переопределения для отдельных групп: `channels.line.groups.<groupId>.allowFrom` (а также `enabled`, `requireMention`, `systemPrompt`, `skills`)
- На статические группы доступа отправителей можно ссылаться из `allowFrom`, `groupAllowFrom` и `allowFrom` отдельных групп с помощью `accessGroup:<name>`; см. [Группы доступа](/ru/channels/access-groups).
- Примечание о среде выполнения: если `channels.line` полностью отсутствует, среда выполнения использует резервное значение `groupPolicy="allowlist"` для проверок групп (даже если задано `channels.defaults.groupPolicy`).

Идентификаторы LINE чувствительны к регистру. Допустимые идентификаторы выглядят так:

- Пользователь: `U` + 32 шестнадцатеричных символа
- Группа: `C` + 32 шестнадцатеричных символа
- Комната: `R` + 32 шестнадцатеричных символа

## Поведение сообщений

- Текст разбивается на фрагменты по 5000 символов.
- Форматирование Markdown удаляется; блоки кода и таблицы по возможности преобразуются
  в Flex-карточки.
- Потоковые ответы буферизуются; LINE получает полные фрагменты с анимацией
  загрузки, пока агент работает.
- Размер загружаемых медиафайлов ограничен параметром `channels.line.mediaMaxMb` (по умолчанию 10).
- Входящие медиафайлы сохраняются в `~/.openclaw/media/inbound/` перед передачей
  агенту в соответствии с общим хранилищем медиафайлов, используемым другими плагинами каналов.

## Данные канала (форматированные сообщения)

Используйте `channelData.line` для отправки быстрых ответов, местоположений, Flex-карточек или
шаблонных сообщений.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {/* Flex payload */},
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

Plugin LINE также предоставляет команду `/card` для предустановок Flex-сообщений:

```text
/card info "Welcome" "Thanks for joining!"
```

## Поддержка ACP

LINE поддерживает привязку диалогов ACP (протокол взаимодействия агентов):

- `/acp spawn <agent> --bind here` привязывает текущий чат LINE к сеансу ACP без создания дочерней ветки.
- Настроенные привязки ACP и активные сеансы ACP, привязанные к диалогам, работают в LINE так же, как и в других диалоговых каналах.

Подробности см. в разделе [Агенты ACP](/ru/tools/acp-agents).

## Исходящие медиафайлы

Plugin LINE отправляет изображения, видео и аудио через инструмент сообщений агента:

- **Изображения**: отправляются как сообщения LINE с изображениями; в качестве изображения предварительного просмотра по умолчанию используется URL медиафайла.
- **Видео**: требуют изображения предварительного просмотра; задайте URL изображения в `channelData.line.previewImageUrl`.
- **Аудио**: отправляются как аудиосообщения LINE; длительность по умолчанию составляет 60 секунд, если не задано `channelData.line.durationMs`.

Тип медиафайла берётся из `channelData.line.mediaKind`, если этот параметр задан; в противном случае он определяется
по другим параметрам LINE или суффиксу файла в URL, а резервным вариантом является изображение.

URL исходящих медиафайлов должны быть общедоступными URL-адресами HTTPS длиной не более 2000 символов. OpenClaw
проверяет имя целевого хоста перед передачей URL в LINE и отклоняет адреса local loopback,
локального канала и частной сети.

При обычной отправке медиафайлов без параметров, специфичных для LINE, используется маршрут изображений.

## Устранение неполадок

- **Проверка вебхука завершается ошибкой:** убедитесь, что URL вебхука использует HTTPS, а
  `channelSecret` соответствует значению в Console LINE.
- **Нет входящих событий:** убедитесь, что путь вебхука соответствует `channels.line.webhookPath`
  и что Gateway доступен из LINE.
- **Ошибки загрузки медиафайлов:** увеличьте `channels.line.mediaMaxMb`, если размер медиафайла превышает
  лимит по умолчанию.

## Связанные разделы

- [Обзор каналов](/ru/channels) — все поддерживаемые каналы
- [Сопряжение](/ru/channels/pairing) — аутентификация личных сообщений и процесс сопряжения
- [Группы](/ru/channels/groups) — поведение групповых чатов и требование упоминания
- [Маршрутизация каналов](/ru/channels/channel-routing) — маршрутизация сеансов для сообщений
- [Безопасность](/ru/gateway/security) — модель доступа и усиление защиты
