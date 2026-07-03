---
read_when:
    - Ви хочете знайти ідентифікатори контактів/груп/власного профілю для каналу
    - Ви розробляєте адаптер каталогу каналів
summary: Довідник CLI для `openclaw directory` (себе, учасників, груп)
title: Каталог
x-i18n:
    generated_at: "2026-07-03T17:40:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d17f545ce0bbe23a6c1ba74e4d1b44b103cc985b52affe4b25fbc6a6d1121045
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Пошук у каталозі для каналів, які це підтримують (контакти/peers, групи та «я»).

## Поширені прапорці

- `--channel <name>`: ідентифікатор/псевдонім каналу (обов’язково, коли налаштовано кілька каналів; автоматично, коли налаштовано лише один)
- `--account <id>`: ідентифікатор облікового запису (за замовчуванням: типовий для каналу)
- `--json`: вивести JSON

## Примітки

- `directory` призначено, щоб допомогти знайти ідентифікатори, які можна вставити в інші команди (особливо `openclaw message send --target ...`).
- Для багатьох каналів результати беруться з конфігурації (allowlists / налаштовані групи), а не з живого каталогу провайдера.
- Установлені Plugin каналів усе ще можуть не підтримувати каталог; у такому разі команда повідомляє про непідтримувану операцію каталогу замість перевстановлення Plugin.
- Типовий вивід — це `id` (і іноді `name`), розділені табуляцією; використовуйте `--json` для скриптів.

## Використання результатів із `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Формати ідентифікаторів (за каналом)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (група), `120363123456789@newsletter` (ціль вихідного надсилання Channel/Newsletter)
- Signal: налаштовані псевдоніми розв’язуються в цілі DM E.164/UUID або групові цілі `group:<id>`
- Telegram: `@username` або числовий ідентифікатор чату; групи мають числові ідентифікатори
- Slack: `user:U…` і `channel:C…`
- Discord: `user:<id>` і `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` або `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` і `conversation:<id>`
- Zalo (Plugin): ідентифікатор користувача (Bot API)
- Zalo Personal / `zalouser` (Plugin): ідентифікатор треду (DM/група) з `zca` (`me`, `friend list`, `group list`)

## Власний профіль («я»)

```bash
openclaw directory self --channel zalouser
```

## Peers (контакти/користувачі)

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
