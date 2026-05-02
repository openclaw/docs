---
read_when:
    - Ви хочете знайти ідентифікатори контактів, груп або власні ідентифікатори для каналу
    - Ви розробляєте адаптер каталогу каналів
summary: Довідник CLI для `openclaw directory` (себе, однорангові вузли, групи)
title: Каталог
x-i18n:
    generated_at: "2026-05-02T20:13:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 011f762d6f53605a37bd12b31c767594c0efa5681da4b2aabe7fb358751b1542
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Пошук у каталозі для каналів, які його підтримують (контакти/однорангові учасники, групи та «я»).

## Загальні прапорці

- `--channel <name>`: ID/псевдонім каналу (обов’язково, коли налаштовано кілька каналів; автоматично, коли налаштовано лише один)
- `--account <id>`: ID облікового запису (типове значення: типове для каналу)
- `--json`: вивести JSON

## Примітки

- `directory` призначено, щоб допомогти вам знайти ID, які можна вставити в інші команди (особливо `openclaw message send --target ...`).
- Для багатьох каналів результати базуються на конфігурації (списки дозволених / налаштовані групи), а не на живому каталозі провайдера.
- Встановлені плагіни каналів усе одно можуть не підтримувати каталог; у такому разі команда повідомляє про непідтримувану операцію каталогу замість перевстановлення плагіна.
- Типовий вивід — `id` (а іноді `name`), розділені табуляцією; використовуйте `--json` для скриптів.

## Використання результатів із `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Формати ID (за каналом)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (група), `120363123456789@newsletter` (вихідна ціль Channel/Newsletter)
- Telegram: `@username` або числовий ID чату; групи мають числові ID
- Slack: `user:U…` і `channel:C…`
- Discord: `user:<id>` і `channel:<id>`
- Matrix (плагін): `user:@user:server`, `room:!roomId:server` або `#alias:server`
- Microsoft Teams (плагін): `user:<id>` і `conversation:<id>`
- Zalo (плагін): ID користувача (Bot API)
- Zalo Personal / `zalouser` (плагін): ID потоку (DM/група) з `zca` (`me`, `friend list`, `group list`)

## Себе ("me")

```bash
openclaw directory self --channel zalouser
```

## Однорангові учасники (контакти/користувачі)

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

## Пов’язане

- [Довідник CLI](/uk/cli)
