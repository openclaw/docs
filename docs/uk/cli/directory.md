---
read_when:
    - Ви хочете знайти ідентифікатори контактів, груп або власний ідентифікатор для каналу
    - Ви розробляєте адаптер каталогу каналу
summary: Довідник CLI для `openclaw directory` (власний профіль, однорангові вузли, групи)
title: Каталог
x-i18n:
    generated_at: "2026-07-12T13:06:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e1a952525f79dcb6eedb87eb433be7cb378fa19de5f252521e287d2c52275c
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Пошук у каталогах для каналів, які його підтримують: контакти/співрозмовники, групи та «я» (власний обліковий запис).

Результати призначені для вставлення в інші команди, особливо в `openclaw message send --target ...`.

## Загальні прапорці

- `--channel <name>`: ідентифікатор/псевдонім каналу (обов’язковий, якщо налаштовано кілька каналів; вибирається автоматично, якщо налаштовано лише один)
- `--account <id>`: ідентифікатор облікового запису (типово: стандартний для каналу)
- `--json`: вивести JSON

Типовий вивід (не у форматі JSON) — це `id` (а іноді й `name`), розділені символом табуляції.

## Примітки

- Для багатьох каналів результати ґрунтуються на конфігурації (списках дозволених / налаштованих групах), а не на актуальному каталозі провайдера.
- Уже встановлений Plugin каналу може не підтримувати каталог. У такому разі команда повідомляє про непідтримувану операцію; вона не намагається перевстановити чи оновити Plugin, щоб додати підтримку.

## Використання результатів із `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Формати ідентифікаторів за каналами

| Канал                               | Формат ідентифікатора цілі                                                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567` (приватне повідомлення), `1234567890-1234567890@g.us` (група), `120363123456789@newsletter` (канал/розсилка, лише вихідні повідомлення) |
| Signal                              | Налаштовані псевдоніми зіставляються з цілями приватних повідомлень E.164/UUID або груповими цілями `group:<id>`              |
| Telegram                            | `@username` або числовий ідентифікатор чату; для груп використовуються числові ідентифікатори                                |
| Slack                               | `user:U…` і `channel:C…`                                                                                                      |
| Discord                             | `user:<id>` і `channel:<id>`                                                                                                  |
| Matrix (Plugin)                     | `user:@user:server`, `room:!roomId:server` або `#alias:server`                                                                |
| Microsoft Teams (Plugin)            | `user:<id>` і `conversation:<id>`                                                                                             |
| Zalo (Plugin)                       | Ідентифікатор користувача (Bot API)                                                                                            |
| Zalo Personal / `zalouser` (Plugin) | Ідентифікатор гілки (приватне повідомлення/група) з `zca` (`me`, `friend list`, `group list`)                                 |

## Власний обліковий запис («я»)

```bash
openclaw directory self --channel zalouser
```

## Співрозмовники (контакти/користувачі)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## Групи

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## Пов’язані матеріали

- [Довідник CLI](/uk/cli)
