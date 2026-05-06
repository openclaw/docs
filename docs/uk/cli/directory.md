---
read_when:
    - Ви хочете знайти ідентифікатори контактів/груп/себе для каналу
    - Ви розробляєте адаптер каталогу каналів
summary: Довідник CLI для `openclaw directory` (себе, рівноправних учасників, груп)
title: Каталог
x-i18n:
    generated_at: "2026-05-06T16:00:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 855f9312790134f2d1da53ffbb106167c190155510a7bdef212b5d38c2fba0b3
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Пошук у каталозі для каналів, які його підтримують (контакти/пири, групи та "me").

## Спільні прапорці

- `--channel <name>`: id/псевдонім каналу (обов’язково, коли налаштовано кілька каналів; автоматично, коли налаштовано лише один)
- `--account <id>`: id облікового запису (типово: типовий для каналу)
- `--json`: вивести JSON

## Примітки

- `directory` призначено, щоб допомогти вам знайти ID, які можна вставити в інші команди (особливо `openclaw message send --target ...`).
- Для багатьох каналів результати спираються на конфігурацію (списки дозволених / налаштовані групи), а не на живий каталог провайдера.
- Установлені Plugin каналів усе ще можуть не підтримувати каталог; у такому разі команда повідомляє про непідтримувану операцію каталогу замість перевстановлення Plugin.
- Типовий вивід — це `id` (і іноді `name`), розділені табуляцією; використовуйте `--json` для сценаріїв.

## Використання результатів із `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Формати ID (за каналом)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (група), `120363123456789@newsletter` (вихідна ціль каналу/розсилки)
- Telegram: `@username` або числовий id чату; групи мають числові id
- Slack: `user:U…` і `channel:C…`
- Discord: `user:<id>` і `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` або `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` і `conversation:<id>`
- Zalo (Plugin): id користувача (Bot API)
- Zalo Personal / `zalouser` (Plugin): id гілки (DM/група) з `zca` (`me`, `friend list`, `group list`)

## Себе ("me")

```bash
openclaw directory self --channel zalouser
```

## Пири (контакти/користувачі)

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
