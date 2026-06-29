---
read_when:
    - Работа с поведением WhatsApp/веб-канала или маршрутизацией входящих сообщений
summary: Поддержка канала WhatsApp, управление доступом, поведение доставки и эксплуатация
title: WhatsApp
x-i18n:
    generated_at: "2026-06-28T22:37:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88f81adc38bd64d1e35f382dfc209e690c059d52e522e5cbdf77d1da45c9d15f
    source_path: channels/whatsapp.md
    workflow: 16
---

Статус: готово к production через WhatsApp Web (Baileys). Gateway владеет связанными сессиями.

## Установка (по требованию)

- Онбординг (`openclaw onboard`) и `openclaw channels add --channel whatsapp`
  предлагают установить WhatsApp Plugin при первом выборе.
- `openclaw channels login --channel whatsapp` также предлагает поток установки, когда
  Plugin еще не установлен.
- Dev-канал + git checkout: по умолчанию используется локальный путь Plugin.
- Stable/Beta: сначала устанавливает официальный Plugin `@openclaw/whatsapp` из ClawHub,
  с npm как резервным вариантом.
- Среда выполнения WhatsApp распространяется вне основного npm-пакета OpenClaw, чтобы
  специфичные для WhatsApp зависимости среды выполнения оставались во внешнем Plugin.

Ручная установка остается доступной:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Используйте простой npm-пакет (`@openclaw/whatsapp`) только когда нужен резервный вариант
через registry. Фиксируйте точную версию только когда нужна воспроизводимая установка.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ru/channels/pairing">
    Политика DM по умолчанию — pairing для неизвестных отправителей.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ru/channels/troubleshooting">
    Межканальная диагностика и инструкции по ремонту.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/ru/gateway/configuration">
    Полные шаблоны и примеры конфигурации каналов.
  </Card>
</CardGroup>

## Быстрая настройка

<Steps>
  <Step title="Configure WhatsApp access policy">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Link WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Текущий вход основан на QR. В удаленных или headless-средах перед запуском входа убедитесь, что у вас
    есть надежный способ передать актуальный QR-код на телефон, который будет его сканировать.

    Для конкретной учетной записи:

```bash
openclaw channels login --channel whatsapp --account work
```

    Чтобы подключить существующий/пользовательский каталог авторизации WhatsApp Web перед входом:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Start the gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approve first pairing request (if using pairing mode)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Запросы pairing истекают через 1 час. Ожидающие запросы ограничены 3 на канал.

  </Step>
</Steps>

<Note>
OpenClaw рекомендует по возможности запускать WhatsApp на отдельном номере. (Метаданные канала и поток настройки оптимизированы для такой схемы, но настройки с личным номером также поддерживаются.)
</Note>

<Warning>
Текущий поток настройки WhatsApp поддерживает только QR. QR-коды, отображенные в терминале, скриншоты,
PDF-файлы или вложения чата могут истечь или стать нечитаемыми во время передачи
с удаленной машины. Для удаленных/headless-хостов предпочитайте прямой путь передачи QR-изображения
ручному захвату из терминала.
</Warning>

## Шаблоны развертывания

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    Это самый чистый операционный режим:

    - отдельная идентичность WhatsApp для OpenClaw
    - более понятные DM allowlist и границы маршрутизации
    - меньше вероятность путаницы с чатом с самим собой

    Минимальный шаблон политики:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Personal-number fallback">
    Онбординг поддерживает режим личного номера и записывает базовую конфигурацию, удобную для чата с самим собой:

    - `dmPolicy: "allowlist"`
    - `allowFrom` включает ваш личный номер
    - `selfChatMode: true`

    Во время выполнения защиты чата с самим собой опираются на связанный собственный номер и `allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    Канал платформы обмена сообщениями основан на WhatsApp Web (`Baileys`) в текущей архитектуре каналов OpenClaw.

    В встроенном registry чат-каналов нет отдельного канала обмена сообщениями Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Модель среды выполнения

- Gateway владеет сокетом WhatsApp и циклом переподключения.
- Watchdog переподключения использует активность транспорта WhatsApp Web, а не только объем входящих сообщений приложения, поэтому тихая сессия связанного устройства не перезапускается только потому, что никто недавно не отправлял сообщения. Более длинный лимит тишины приложения все равно принудительно выполняет переподключение, если транспортные frames продолжают поступать, но сообщения приложения не обрабатываются в течение окна watchdog; после временного переподключения для недавно активной сессии эта проверка тишины приложения использует обычный тайм-аут сообщений для первого окна восстановления.
- Тайминги сокета Baileys явно задаются в `web.whatsapp.*`: `keepAliveIntervalMs` управляет application ping WhatsApp Web, `connectTimeoutMs` управляет тайм-аутом начального handshake, а `defaultQueryTimeoutMs` управляет ожиданиями запросов Baileys, а также локальными границами OpenClaw для исходящей отправки/presence и операций входящих read receipt.
- Для исходящих отправок требуется активный слушатель WhatsApp для целевой учетной записи.
- Групповые отправки добавляют нативные метаданные упоминаний для токенов `@+<digits>` и `@<digits>` в тексте и подписях к медиа, когда токен соответствует текущим метаданным участников WhatsApp, включая группы на базе LID.
- Статусы и broadcast-чаты игнорируются (`@status`, `@broadcast`).
- Watchdog переподключения следует активности транспорта WhatsApp Web, а не только объему входящих сообщений приложения: тихие сессии связанного устройства остаются активными, пока транспортные frames продолжаются, но остановка транспорта принудительно вызывает переподключение задолго до более позднего пути удаленного отключения.
- Прямые чаты используют правила DM-сессий (`session.dmScope`; значение по умолчанию `main` сворачивает DM в основную сессию агента).
- Групповые сессии изолированы (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters могут быть явными исходящими целями со своим нативным JID `@newsletter`. Исходящие отправки newsletter используют метаданные сессии канала (`agent:<agentId>:whatsapp:channel:<jid>`), а не семантику DM-сессий.
- Транспорт WhatsApp Web учитывает стандартные переменные окружения proxy на хосте Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / варианты в нижнем регистре). Предпочитайте конфигурацию proxy на уровне хоста настройкам proxy, специфичным для канала WhatsApp.
- Когда `messages.removeAckAfterReply` включен, OpenClaw очищает ack-реакцию WhatsApp после доставки видимого ответа.

## Запросы подтверждения

WhatsApp может отображать запросы подтверждения exec и Plugin с реакциями `👍` / `👎`. Доставка
управляется конфигурацией пересылки подтверждений верхнего уровня:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session",
    },
    plugin: {
      enabled: true,
      mode: "targets",
      targets: [{ channel: "whatsapp", to: "+15551234567" }],
    },
  },
}
```

`approvals.exec` и `approvals.plugin` независимы. Включение WhatsApp как канала только связывает
транспорт; оно не отправляет запросы подтверждения, если соответствующее семейство подтверждений не включено
и не маршрутизируется в WhatsApp. Режим session доставляет нативные emoji-подтверждения только для подтверждений,
которые исходят из WhatsApp. Режим target использует общий pipeline пересылки для явных целей WhatsApp
и не создает отдельную рассылку approver-DM.

Реакции подтверждения WhatsApp требуют явных approvers WhatsApp из `allowFrom` или `"*"`.
`defaultTo` управляет обычными целями сообщений по умолчанию; это не approver подтверждений. Ручные
команды `/approve` все равно проходят через обычный путь авторизации отправителя WhatsApp перед
разрешением подтверждения.

## Хуки Plugin и приватность

Входящие сообщения WhatsApp могут содержать личное содержимое сообщений, номера телефонов,
идентификаторы групп, имена отправителей и поля корреляции сессий. Поэтому
WhatsApp не транслирует входящие payload хуков `message_received` в Plugins,
если вы явно не включите это:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

Вы можете ограничить включение одной учетной записью:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

Включайте это только для Plugins, которым вы доверяете получение содержимого
и идентификаторов входящих сообщений WhatsApp.

## Контроль доступа и активация

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` управляет доступом к прямым чатам:

    - `pairing` (по умолчанию)
    - `allowlist`
    - `open` (требует, чтобы `allowFrom` включал `"*"`)
    - `disabled`

    `allowFrom` принимает номера в стиле E.164 (нормализуются внутри).

    `allowFrom` — это список контроля доступа отправителей DM. Он не ограничивает явные исходящие отправки в JID групп WhatsApp или JID каналов `@newsletter`.

    Переопределение для нескольких учетных записей: `channels.whatsapp.accounts.<id>.dmPolicy` (и `allowFrom`) имеют приоритет над значениями по умолчанию на уровне канала для этой учетной записи.

    Подробности поведения во время выполнения:

    - pairings сохраняются в allow-store канала и объединяются с настроенным `allowFrom`
    - запланированная автоматизация и резервный выбор получателей Heartbeat используют явные цели доставки или настроенный `allowFrom`; DM pairing approvals не являются неявными получателями Cron или Heartbeat
    - если allowlist не настроен, связанный собственный номер разрешен по умолчанию
    - OpenClaw никогда автоматически не выполняет pairing исходящих DM `fromMe` (сообщений, которые вы отправляете самому себе со связанного устройства)

  </Tab>

  <Tab title="Group policy + allowlists">
    Групповой доступ имеет два слоя:

    1. **Allowlist членства в группах** (`channels.whatsapp.groups`)
       - если `groups` опущен, подходят все группы
       - если `groups` присутствует, он действует как allowlist групп (`"*"` разрешен)

    2. **Политика отправителей групп** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist отправителей обходится
       - `allowlist`: отправитель должен соответствовать `groupAllowFrom` (или `*`)
       - `disabled`: блокировать все входящие сообщения групп

    Резервный вариант allowlist отправителей:

    - если `groupAllowFrom` не задан, среда выполнения откатывается к `allowFrom`, когда он доступен
    - allowlist отправителей оцениваются до активации по упоминанию/ответу

    Примечание: если блок `channels.whatsapp` полностью отсутствует, резервное значение group-policy во время выполнения — `allowlist` (с предупреждением в логе), даже если `channels.defaults.groupPolicy` задан.

  </Tab>

  <Tab title="Mentions + /activation">
    Групповые ответы по умолчанию требуют упоминания.

    Обнаружение упоминаний включает:

    - явные упоминания WhatsApp идентичности бота
    - настроенные regex-шаблоны упоминаний (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - transcript входящих голосовых заметок для авторизованных групповых сообщений
    - неявное обнаружение ответа боту (отправитель ответа соответствует идентичности бота)

    Примечание по безопасности:

    - quote/reply удовлетворяет только gating по упоминанию; он **не** выдает авторизацию отправителю
    - с `groupPolicy: "allowlist"` отправители вне allowlist все равно блокируются, даже если они отвечают на сообщение пользователя из allowlist

    Команда активации на уровне сессии:

    - `/activation mention`
    - `/activation always`

    `activation` обновляет состояние сессии (не глобальную конфигурацию). Она ограничена владельцем.

  </Tab>
</Tabs>

## Настроенные привязки ACP

WhatsApp поддерживает постоянные привязки ACP с записями верхнего уровня `bindings[]`:

```json5
{
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "direct", id: "+15555550123" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "group", id: "120363424282127706@g.us" },
      },
    },
  ],
}
```

- Прямые чаты сопоставляются с номерами E.164, такими как `+15555550123`.
- Группы сопоставляются с JID групп WhatsApp, такими как `120363424282127706@g.us`.
- Списки разрешённых групп, политика отправителей и шлюзы упоминаний или активации выполняются до того, как OpenClaw проверяет наличие настроенной сессии ACP.
- Совпавшая настроенная привязка ACP владеет маршрутом. Группы рассылки WhatsApp не рассылают этот ход обычным сессиям WhatsApp.

## Поведение личного номера и чата с собой

Когда связанный собственный номер также присутствует в `allowFrom`, включаются защитные механизмы WhatsApp для чата с собой:

- пропускать уведомления о прочтении для ходов в чате с собой
- игнорировать поведение автозапуска по mention-JID, которое иначе отправило бы пинг самому себе
- если `messages.responsePrefix` не задан, ответы в чате с собой по умолчанию используют `[{identity.name}]` или `[openclaw]`

## Нормализация сообщений и контекст

<AccordionGroup>
  <Accordion title="Входящий конверт + контекст ответа">
    Входящие сообщения WhatsApp оборачиваются в общий входящий конверт.

    Если существует цитируемый ответ, контекст добавляется в такой форме:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Поля метаданных ответа также заполняются, когда доступны (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 отправителя).
    Когда цель цитируемого ответа является скачиваемым медиа, OpenClaw сохраняет её через
    обычное хранилище входящих медиа и предоставляет как `MediaPath`/`MediaType`, чтобы
    агент мог изучить указанное изображение, а не видеть только
    `<media:image>`.

  </Accordion>

  <Accordion title="Медиа-плейсхолдеры и извлечение местоположения/контактов">
    Входящие сообщения только с медиа нормализуются с плейсхолдерами, такими как:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Разрешённые групповые голосовые заметки транскрибируются до шлюза упоминаний, когда
    тело содержит только `<media:audio>`, поэтому произнесённое упоминание бота в голосовой заметке может
    запустить ответ. Если транскрипт всё равно не упоминает бота,
    транскрипт сохраняется в ожидающей истории группы вместо сырого плейсхолдера.

    Тела местоположений используют краткий текст координат. Метки/комментарии местоположения и сведения контакта/vCard отображаются как ограждённые недоверенные метаданные, а не как встроенный текст промпта.

  </Accordion>

  <Accordion title="Внедрение ожидающей истории группы">
    Для групп необработанные сообщения могут буферизоваться и внедряться как контекст, когда бот наконец запускается.

    - лимит по умолчанию: `50`
    - конфигурация: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` отключает

    Маркеры внедрения:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Уведомления о прочтении">
    Уведомления о прочтении включены по умолчанию для принятых входящих сообщений WhatsApp.

    Отключить глобально:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Переопределение для отдельного аккаунта:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Ходы в чате с собой пропускают уведомления о прочтении, даже когда они включены глобально.

  </Accordion>
</AccordionGroup>

## Доставка, разбиение на части и медиа

<AccordionGroup>
  <Accordion title="Разбиение текста на части">
    - лимит части по умолчанию: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - режим `newline` предпочитает границы абзацев (пустые строки), затем возвращается к безопасному по длине разбиению

  </Accordion>

  <Accordion title="Поведение исходящих медиа">
    - поддерживает полезные нагрузки изображений, видео, аудио (голосовая заметка PTT) и документов
    - аудиомедиа отправляется через полезную нагрузку Baileys `audio` с `ptt: true`, поэтому клиенты WhatsApp отображают его как голосовую заметку push-to-talk
    - полезные нагрузки ответов сохраняют `audioAsVoice`; вывод голосовой заметки TTS для WhatsApp остаётся на этом пути PTT, даже когда провайдер возвращает MP3 или WebM
    - нативное аудио Ogg/Opus отправляется как `audio/ogg; codecs=opus` для совместимости с голосовыми заметками
    - аудио не в Ogg, включая вывод Microsoft Edge TTS MP3/WebM, транскодируется с помощью `ffmpeg` в моно Ogg/Opus 48 кГц перед доставкой PTT
    - `/tts latest` отправляет последний ответ ассистента как одну голосовую заметку и подавляет повторные отправки того же ответа; `/tts chat on|off|default` управляет авто-TTS для текущего чата WhatsApp
    - воспроизведение анимированных GIF поддерживается через `gifPlayback: true` при отправке видео
    - `forceDocument` / `asDocument` отправляет исходящие изображения, GIF и видео через полезную нагрузку документа Baileys, чтобы избежать сжатия медиа WhatsApp, сохраняя разрешённое имя файла и MIME-тип
    - подписи применяются к первому медиаэлементу при отправке полезных нагрузок ответов с несколькими медиа, кроме голосовых заметок PTT: они отправляют аудио первым, а видимый текст отдельно, потому что клиенты WhatsApp не всегда стабильно отображают подписи голосовых заметок
    - источник медиа может быть HTTP(S), `file://` или локальными путями

  </Accordion>

  <Accordion title="Ограничения размера медиа и поведение fallback">
    - лимит сохранения входящих медиа: `channels.whatsapp.mediaMaxMb` (по умолчанию `50`)
    - лимит отправки исходящих медиа: `channels.whatsapp.mediaMaxMb` (по умолчанию `50`)
    - переопределения для отдельных аккаунтов используют `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - изображения автоматически оптимизируются (изменение размера/перебор качества), чтобы уложиться в лимиты, если `forceDocument` / `asDocument` не запрашивает доставку как документа
    - при сбое отправки медиа fallback для первого элемента отправляет текстовое предупреждение вместо молчаливого отбрасывания ответа

  </Accordion>
</AccordionGroup>

## Цитирование ответов

WhatsApp поддерживает нативное цитирование ответов, когда исходящие ответы видимо цитируют входящее сообщение. Управляйте этим с помощью `channels.whatsapp.replyToMode`.

| Значение    | Поведение                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Никогда не цитировать; отправлять как обычное сообщение                |
| `"first"`   | Цитировать только первую часть исходящего ответа                       |
| `"all"`     | Цитировать каждую часть исходящего ответа                              |
| `"batched"` | Цитировать поставленные в очередь пакетные ответы, оставляя немедленные ответы без цитирования |

По умолчанию используется `"off"`. Переопределения для отдельных аккаунтов используют `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Уровень реакций

`channels.whatsapp.reactionLevel` управляет тем, насколько широко агент использует emoji-реакции в WhatsApp:

| Уровень      | Реакции ack | Реакции, инициированные агентом | Описание                                      |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | Нет           | Нет                       | Реакций нет вообще                              |
| `"ack"`       | Да            | Нет                       | Только реакции ack (подтверждение до ответа)    |
| `"minimal"`   | Да            | Да (консервативно)        | Ack + реакции агента с консервативными указаниями |
| `"extensive"` | Да            | Да (поощряются)           | Ack + реакции агента с поощряющими указаниями   |

По умолчанию: `"minimal"`.

Переопределения для отдельных аккаунтов используют `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Реакции подтверждения

WhatsApp поддерживает немедленные реакции ack при получении входящего сообщения через `channels.whatsapp.ackReaction`.
Реакции ack ограничиваются `reactionLevel` — они подавляются, когда `reactionLevel` равен `"off"`.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Примечания к поведению:

- отправляется немедленно после принятия входящего сообщения (до ответа)
- если `ackReaction` присутствует без `emoji`, WhatsApp использует emoji идентичности маршрутизированного агента, возвращаясь к "👀"; опустите `ackReaction` или задайте `emoji: ""`, чтобы не отправлять реакцию ack
- сбои журналируются, но не блокируют обычную доставку ответа
- режим группы `mentions` реагирует на ходы, запущенные упоминанием; групповая активация `always` действует как обход этой проверки
- WhatsApp использует `channels.whatsapp.ackReaction` (устаревший `messages.ackReaction` здесь не используется)

## Реакции статуса жизненного цикла

Задайте `messages.statusReactions.enabled: true`, чтобы WhatsApp заменял реакцию ack во время хода вместо сохранения статичного emoji подтверждения. Когда включено, OpenClaw использует тот же слот реакции входящего сообщения для состояний жизненного цикла, таких как очередь, размышление, активность инструментов, Compaction, завершено и ошибка.

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
      emojis: {
        deploy: "🛫",
        build: "🏗️",
        concierge: "💁",
      },
    },
  },
}
```

Примечания к поведению:

- `channels.whatsapp.ackReaction` по-прежнему управляет тем, доступны ли реакции статуса для прямых сообщений и групп.
- Реакция статуса в очереди использует тот же эффективный emoji ack, что и обычные реакции ack.
- У WhatsApp есть один слот реакции бота на сообщение, поэтому обновления жизненного цикла заменяют текущую реакцию на месте.
- `messages.removeAckAfterReply: true` очищает финальную реакцию статуса после настроенной задержки done/error.
- Категории emoji инструментов включают `tool`, `coding`, `web`, `deploy`, `build` и `concierge`.

## Несколько аккаунтов и учётные данные

<AccordionGroup>
  <Accordion title="Выбор аккаунта и значения по умолчанию">
    - идентификаторы аккаунтов берутся из `channels.whatsapp.accounts`
    - выбор аккаунта по умолчанию: `default`, если присутствует, иначе первый настроенный идентификатор аккаунта (по сортировке)
    - идентификаторы аккаунтов нормализуются внутри для поиска

  </Accordion>

  <Accordion title="Пути учётных данных и совместимость с устаревшим форматом">
    - текущий путь авторизации: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - файл резервной копии: `creds.json.bak`
    - устаревшая авторизация по умолчанию в `~/.openclaw/credentials/` всё ещё распознаётся/мигрируется для потоков аккаунта по умолчанию

  </Accordion>

  <Accordion title="Поведение выхода">
    `openclaw channels logout --channel whatsapp [--account <id>]` очищает состояние авторизации WhatsApp для этого аккаунта.

    Когда Gateway доступен, выход сначала останавливает активный слушатель WhatsApp для выбранного аккаунта, чтобы связанная сессия не продолжала получать сообщения до следующего перезапуска. `openclaw channels remove --channel whatsapp` также останавливает активный слушатель перед отключением или удалением конфигурации аккаунта.

    В устаревших каталогах авторизации `oauth.json` сохраняется, а файлы авторизации Baileys удаляются.

  </Accordion>
</AccordionGroup>

## Инструменты, действия и записи конфигурации

- Поддержка инструментов агента включает действие реакции WhatsApp (`react`).
- Шлюзы действий:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Записи конфигурации, инициированные каналом, включены по умолчанию (отключение через `channels.whatsapp.configWrites=false`).

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Не связано (требуется QR)">
    Симптом: статус канала сообщает, что он не связан.

    Исправление:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Связано, но отключено / цикл повторного подключения">
    Симптом: связанный аккаунт с повторяющимися отключениями или попытками повторного подключения.

    Тихие аккаунты могут оставаться подключёнными дольше обычного тайм-аута сообщений; watchdog
    перезапускается, когда активность транспорта WhatsApp Web прекращается, сокет закрывается или
    активность уровня приложения остаётся бездействующей дольше более длительного защитного окна.

    Если в журналах многократно появляется `status=408 Request Time-out Connection was lost`, настройте
    тайминги сокета Baileys в `web.whatsapp`. Начните с уменьшения
    `keepAliveIntervalMs` ниже тайм-аута простоя вашей сети и увеличения
    `connectTimeoutMs` на медленных каналах или каналах с потерями:

    ```json5
    {
      web: {
        whatsapp: {
          keepAliveIntervalMs: 15000,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
        },
      },
    }
    ```

    Исправление:

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    Если цикл сохраняется после исправления подключения хоста и таймингов, создайте резервную копию
    каталога авторизации учетной записи и повторно привяжите эту учетную запись:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Если `~/.openclaw/logs/whatsapp-health.log` сообщает `Gateway inactive`, но
    `openclaw gateway status` и `openclaw channels status --probe` показывают, что
    Gateway и WhatsApp исправны, выполните `openclaw doctor`. В Linux doctor
    предупреждает об устаревших записях crontab, которые все еще вызывают
    `~/.openclaw/bin/ensure-whatsapp.sh`; удалите эти устаревшие записи с помощью
    `crontab -e`, потому что cron может не иметь окружения пользовательской шины systemd и
    из-за этого старый скрипт может неверно сообщать о состоянии Gateway.

    При необходимости выполните повторную привязку с помощью `channels login`.

  </Accordion>

  <Accordion title="Вход по QR-коду завершается тайм-аутом за прокси">
    Симптом: `openclaw channels login --channel whatsapp` завершается ошибкой до показа пригодного QR-кода с `status=408 Request Time-out` или разрывом TLS-сокета.

    Вход в WhatsApp Web использует стандартное прокси-окружение хоста Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, варианты в нижнем регистре и `NO_PROXY`). Убедитесь, что процесс Gateway наследует переменные окружения прокси и что `NO_PROXY` не совпадает с `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Нет активного слушателя при отправке">
    Исходящие отправки быстро завершаются ошибкой, когда для целевой учетной записи нет активного слушателя Gateway.

    Убедитесь, что Gateway запущен, а учетная запись привязана.

  </Accordion>

  <Accordion title="Ответ появляется в стенограмме, но не в WhatsApp">
    Строки стенограммы записывают то, что сгенерировал агент. Доставка в WhatsApp проверяется отдельно: OpenClaw считает автоответ отправленным только после того, как Baileys вернет идентификатор исходящего сообщения хотя бы для одной видимой отправки текста или медиа.

    Реакции подтверждения являются независимыми квитанциями перед ответом. Успешная реакция не доказывает, что последующий текстовый или медиаответ был принят WhatsApp.

    Проверьте журналы Gateway на наличие `auto-reply delivery failed` или `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Сообщения группы неожиданно игнорируются">
    Проверяйте в таком порядке:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - записи списка разрешенных `groups`
    - фильтрация по упоминаниям (`requireMention` + шаблоны упоминаний)
    - повторяющиеся ключи в `openclaw.json` (JSON5): более поздние записи переопределяют более ранние, поэтому оставляйте один `groupPolicy` на область

    Если `channels.whatsapp.groups` присутствует, WhatsApp все еще может наблюдать сообщения из других групп, но OpenClaw отбрасывает их до маршрутизации сессии. Добавьте JID группы в `channels.whatsapp.groups` или добавьте `groups["*"]`, чтобы допустить все группы, сохраняя авторизацию отправителей в `groupPolicy` и `groupAllowFrom`.

  </Accordion>

  <Accordion title="Предупреждение среды выполнения Bun">
    Среда выполнения Gateway WhatsApp должна использовать Node. Bun помечен как несовместимый для стабильной работы Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Системные промпты

WhatsApp поддерживает системные промпты в стиле Telegram для групп и прямых чатов через карты `groups` и `direct`.

Иерархия разрешения для групповых сообщений:

Эффективная карта `groups` определяется первой: если учетная запись определяет собственные `groups`, она полностью заменяет корневую карту `groups` (без глубокого слияния). Затем поиск промпта выполняется в получившейся единственной карте:

1. **Системный промпт для конкретной группы** (`groups["<groupId>"].systemPrompt`): используется, когда запись конкретной группы существует в карте **и** ее ключ `systemPrompt` определен. Если `systemPrompt` является пустой строкой (`""`), подстановочный вариант подавляется и системный промпт не применяется.
2. **Подстановочный системный промпт для групп** (`groups["*"].systemPrompt`): используется, когда запись конкретной группы полностью отсутствует в карте или когда она существует, но не определяет ключ `systemPrompt`.

Иерархия разрешения для прямых сообщений:

Эффективная карта `direct` определяется первой: если учетная запись определяет собственный `direct`, он полностью заменяет корневую карту `direct` (без глубокого слияния). Затем поиск промпта выполняется в получившейся единственной карте:

1. **Системный промпт для конкретного прямого чата** (`direct["<peerId>"].systemPrompt`): используется, когда запись конкретного собеседника существует в карте **и** ее ключ `systemPrompt` определен. Если `systemPrompt` является пустой строкой (`""`), подстановочный вариант подавляется и системный промпт не применяется.
2. **Подстановочный системный промпт для прямых чатов** (`direct["*"].systemPrompt`): используется, когда запись конкретного собеседника полностью отсутствует в карте или когда она существует, но не определяет ключ `systemPrompt`.

<Note>
`dms` остается легковесным контейнером переопределения истории для отдельных DM (`dms.<id>.historyLimit`). Переопределения промптов находятся в `direct`.
</Note>

**Отличие от поведения нескольких учетных записей Telegram:** В Telegram корневые `groups` намеренно подавляются для всех учетных записей в конфигурации с несколькими учетными записями — даже для учетных записей, которые не определяют собственные `groups`, — чтобы бот не получал сообщения групп, к которым он не принадлежит. WhatsApp не применяет эту защиту: корневые `groups` и корневой `direct` всегда наследуются учетными записями, которые не определяют переопределение на уровне учетной записи, независимо от количества настроенных учетных записей. В конфигурации WhatsApp с несколькими учетными записями, если вам нужны групповые или прямые промпты для каждой учетной записи, явно определяйте полную карту в каждой учетной записи, а не полагайтесь на корневые значения по умолчанию.

Важное поведение:

- `channels.whatsapp.groups` является и картой конфигурации для отдельных групп, и списком разрешенных групп на уровне чата. На корневом уровне или уровне учетной записи `groups["*"]` означает «допускаются все группы» для этой области.
- Добавляйте подстановочный `systemPrompt` группы только тогда, когда вы уже хотите, чтобы эта область допускала все группы. Если вы по-прежнему хотите, чтобы подходящим был только фиксированный набор идентификаторов групп, не используйте `groups["*"]` как значение промпта по умолчанию. Вместо этого повторите промпт в каждой явно разрешенной записи группы.
- Допуск группы и авторизация отправителя являются отдельными проверками. `groups["*"]` расширяет набор групп, которые могут попасть в обработку групп, но само по себе не авторизует каждого отправителя в этих группах. Доступ отправителей по-прежнему отдельно контролируется `channels.whatsapp.groupPolicy` и `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` не имеет такого же побочного эффекта для DM. `direct["*"]` только предоставляет конфигурацию прямого чата по умолчанию после того, как DM уже допущен через `dmPolicy` плюс `allowFrom` или правила хранилища привязок.

Пример:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## Указатели на справочник конфигурации

Основной справочник:

- [Справочник конфигурации - WhatsApp](/ru/gateway/config-channels#whatsapp)

Наиболее важные поля WhatsApp:

- доступ: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- несколько учетных записей: `accounts.<id>.enabled`, `accounts.<id>.authDir`, переопределения на уровне учетной записи
- операции: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- поведение сессии: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- промпты: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Связанные разделы

- [Привязка](/ru/channels/pairing)
- [Группы](/ru/channels/groups)
- [Безопасность](/ru/gateway/security)
- [Маршрутизация каналов](/ru/channels/channel-routing)
- [Маршрутизация нескольких агентов](/ru/concepts/multi-agent)
- [Устранение неполадок](/ru/channels/troubleshooting)
