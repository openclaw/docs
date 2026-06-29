---
read_when:
    - Вы хотите подключить бота Yuanbao
    - Вы настраиваете канал Yuanbao
summary: Обзор, возможности и конфигурация бота Yuanbao
title: Yuanbao
x-i18n:
    generated_at: "2026-06-28T22:38:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3830af0206854e500132edfc9340724fe97f90ca60fa23ce05202d96d9cacf04
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao — это платформа AI-ассистента от Tencent. Plugin канала OpenClaw
подключает ботов Yuanbao к OpenClaw через WebSocket, чтобы они могли взаимодействовать с пользователями
через личные сообщения и групповые чаты.

**Статус:** готово к production для личных сообщений бота и групповых чатов. WebSocket — единственный поддерживаемый режим подключения.

---

## Быстрый старт

> **Требуется OpenClaw 2026.4.10 или выше.** Выполните `openclaw --version`, чтобы проверить версию. Обновитесь с помощью `openclaw update`.

<Steps>
  <Step title="Добавьте канал Yuanbao с вашими учетными данными">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  Значение `--token` использует формат `appKey:appSecret` с разделением двоеточием. Вы можете получить эти значения в приложении Yuanbao, создав робота в настройках своего приложения.
  </Step>

  <Step title="После завершения настройки перезапустите gateway, чтобы применить изменения">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### Интерактивная настройка (альтернатива)

Вы также можете использовать интерактивный мастер:

```bash
openclaw channels login --channel yuanbao
```

Следуйте подсказкам, чтобы ввести ваш App ID и App Secret.

---

## Контроль доступа

### Личные сообщения

Настройте `dmPolicy`, чтобы управлять тем, кто может отправлять боту личные сообщения:

- `"pairing"` - неизвестные пользователи получают код сопряжения; подтвердите через CLI
- `"allowlist"` - общаться могут только пользователи, перечисленные в `allowFrom`
- `"open"` - разрешить всех пользователей (по умолчанию)
- `"disabled"` - отключить все личные сообщения

**Подтвердить запрос на сопряжение:**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Групповые чаты

**Требование упоминания** (`channels.yuanbao.requireMention`):

- `true` - требуется @упоминание (по умолчанию)
- `false` - отвечать без @упоминания

Ответ на сообщение бота в групповом чате считается неявным упоминанием.

---

## Примеры конфигурации

### Базовая настройка с открытой политикой личных сообщений

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "open",
      },
    },
  },
}
```

### Ограничить личные сообщения конкретными пользователями

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "allowlist",
        allowFrom: ["user_id_1", "user_id_2"],
      },
    },
  },
}
```

### Отключить требование @упоминания в группах

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

### Оптимизировать доставку исходящих сообщений

```json5
{
  channels: {
    yuanbao: {
      // Send each chunk immediately without buffering
      outboundQueueStrategy: "immediate",
    },
  },
}
```

### Настроить стратегию merge-text

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // buffer until this many chars
      maxChars: 3000, // force split above this limit
      idleMs: 5000, // auto-flush after idle timeout (ms)
    },
  },
}
```

---

## Распространенные команды

| Команда    | Описание                    |
| ---------- | --------------------------- |
| `/help`    | Показать доступные команды  |
| `/status`  | Показать статус бота        |
| `/new`     | Начать новый сеанс          |
| `/stop`    | Остановить текущий запуск   |
| `/restart` | Перезапустить OpenClaw      |
| `/compact` | Сжать контекст сеанса       |

> Yuanbao поддерживает встроенные меню slash-команд. Команды автоматически синхронизируются с платформой при запуске gateway.

---

## Устранение неполадок

### Бот не отвечает в групповых чатах

1. Убедитесь, что бот добавлен в группу
2. Убедитесь, что вы @упомянули бота (требуется по умолчанию)
3. Проверьте журналы: `openclaw logs --follow`

### Бот не получает сообщения

1. Убедитесь, что бот создан и подтвержден в приложении Yuanbao
2. Убедитесь, что `appKey` и `appSecret` настроены правильно
3. Убедитесь, что gateway запущен: `openclaw gateway status`
4. Проверьте журналы: `openclaw logs --follow`

### Бот отправляет пустые или fallback-ответы

1. Проверьте, возвращает ли AI-модель корректное содержимое
2. Fallback-ответ по умолчанию: "暂时无法解答，你可以换个问题问问我哦"
3. Настройте его через `channels.yuanbao.fallbackReply`

### App Secret раскрыт

1. Сбросьте App Secret в YuanBao APP
2. Обновите значение в вашей конфигурации
3. Перезапустите gateway: `openclaw gateway restart`

---

## Расширенная конфигурация

### Несколько учетных записей

```json5
{
  channels: {
    yuanbao: {
      defaultAccount: "main",
      accounts: {
        main: {
          appKey: "key_xxx",
          appSecret: "secret_xxx",
          name: "Primary bot",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` управляет тем, какая учетная запись используется, когда исходящие API не указывают `accountId`.

### Лимиты сообщений

- `maxChars` - максимальное число символов в одном сообщении (по умолчанию: `3000` символов)
- `mediaMaxMb` - лимит загрузки/скачивания медиа (по умолчанию: `20` МБ)
- `overflowPolicy` - поведение, когда сообщение превышает лимит: `"split"` (по умолчанию) или `"stop"`

### Потоковая передача

Yuanbao поддерживает потоковый вывод на уровне блоков. Когда он включен, бот отправляет текст фрагментами по мере генерации.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // block streaming enabled (default)
    },
  },
}
```

Установите `disableBlockStreaming: true`, чтобы отправлять полный ответ одним сообщением.

### Контекст истории группового чата

Управляйте тем, сколько исторических сообщений включается в AI-контекст для групповых чатов:

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

### Режим reply-to

Управляйте тем, как бот цитирует сообщения при ответах в групповых чатах:

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| Значение  | Поведение                                                |
| --------- | -------------------------------------------------------- |
| `"off"`   | Не цитировать в ответе                                   |
| `"first"` | Цитировать только первый ответ на входящее сообщение (по умолчанию) |
| `"all"`   | Цитировать каждый ответ                                  |

### Внедрение подсказки Markdown

По умолчанию бот внедряет инструкции в системный промпт, чтобы AI-модель не оборачивала весь ответ в markdown-блоки кода.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // default: true
    },
  },
}
```

### Режим отладки

Включите несаницированный вывод журналов для конкретных ID ботов:

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

### Маршрутизация нескольких агентов

Используйте `bindings`, чтобы маршрутизировать личные сообщения или группы Yuanbao к разным агентам.

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "yuanbao",
        peer: { kind: "direct", id: "user_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "yuanbao",
        peer: { kind: "group", id: "group_zzz" },
      },
    },
  ],
}
```

Поля маршрутизации:

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (личные сообщения) или `"group"` (групповой чат)
- `match.peer.id`: ID пользователя или код группы

---

## Справочник конфигурации

Полная конфигурация: [Конфигурация Gateway](/ru/gateway/configuration)

| Настройка                                  | Описание                                          | По умолчанию                         |
| ------------------------------------------ | ------------------------------------------------- | ------------------------------------ |
| `channels.yuanbao.enabled`                 | Включить/отключить канал                          | `true`                               |
| `channels.yuanbao.defaultAccount`          | Учетная запись по умолчанию для исходящей маршрутизации | `default`                            |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (используется для подписи и генерации ticket) | -                                    |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (используется для подписи)             | -                                    |
| `channels.yuanbao.accounts.<id>.token`     | Предварительно подписанный токен (пропускает автоматическую подпись ticket) | -                                    |
| `channels.yuanbao.accounts.<id>.name`      | Отображаемое имя учетной записи                   | -                                    |
| `channels.yuanbao.accounts.<id>.enabled`   | Включить/отключить конкретную учетную запись      | `true`                               |
| `channels.yuanbao.dm.policy`               | Политика личных сообщений                         | `open`                               |
| `channels.yuanbao.dm.allowFrom`            | Allowlist для личных сообщений (список ID пользователей) | -                                    |
| `channels.yuanbao.requireMention`          | Требовать @упоминание в группах                   | `true`                               |
| `channels.yuanbao.overflowPolicy`          | Обработка длинных сообщений (`split` или `stop`)  | `split`                              |
| `channels.yuanbao.replyToMode`             | Стратегия reply-to в группах (`off`, `first`, `all`) | `first`                              |
| `channels.yuanbao.outboundQueueStrategy`   | Исходящая стратегия (`merge-text` или `immediate`) | `merge-text`                         |
| `channels.yuanbao.minChars`                | Merge-text: минимум символов для запуска отправки | `2800`                               |
| `channels.yuanbao.maxChars`                | Merge-text: максимум символов на сообщение        | `3000`                               |
| `channels.yuanbao.idleMs`                  | Merge-text: тайм-аут бездействия перед автоотправкой (мс) | `5000`                               |
| `channels.yuanbao.mediaMaxMb`              | Лимит размера медиа (МБ)                          | `20`                                 |
| `channels.yuanbao.historyLimit`            | Записи контекста истории группового чата          | `100`                                |
| `channels.yuanbao.disableBlockStreaming`   | Отключить потоковый вывод на уровне блоков        | `false`                              |
| `channels.yuanbao.fallbackReply`           | Fallback-ответ, когда AI не возвращает содержимое | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | Внедрять инструкции против оборачивания markdown  | `true`                               |
| `channels.yuanbao.debugBotIds`             | Whitelist ID ботов для отладки (несаницированные журналы) | `[]`                                 |

---

## Поддерживаемые типы сообщений

### Получение

- ✅ Текст
- ✅ Изображения
- ✅ Файлы
- ✅ Аудио / голос
- ✅ Видео
- ✅ Стикеры / пользовательские эмодзи
- ✅ Пользовательские элементы (карточки ссылок и т. д.)

### Отправка

- ✅ Текст (с поддержкой markdown)
- ✅ Изображения
- ✅ Файлы
- ✅ Аудио
- ✅ Видео
- ✅ Стикеры

### Threads и ответы

- ✅ Ответы с цитированием (настраивается через `replyToMode`)
- ❌ Ответы в thread (не поддерживаются платформой)

---

## См. также

- [Обзор каналов](/ru/channels) - все поддерживаемые каналы
- [Сопряжение](/ru/channels/pairing) - аутентификация личных сообщений и поток сопряжения
- [Группы](/ru/channels/groups) - поведение групповых чатов и gating по упоминаниям
- [Маршрутизация каналов](/ru/channels/channel-routing) - маршрутизация сеансов для сообщений
- [Безопасность](/ru/gateway/security) - модель доступа и усиление защиты
