---
read_when:
    - Ви хочете знайти ідентифікатори контактів/груп/власного облікового запису для каналу
    - Ви розробляєте адаптер каталогу каналів
summary: Довідник CLI для `openclaw directory` (себе, однорангових учасників, груп)
title: Каталог
x-i18n:
    generated_at: "2026-05-02T05:25:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcd0be284c0ec1aa347084d84f7001f1e2f47977ec5198025ba303297858aaab
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Пошук у каталозі для каналів, які це підтримують (контакти/співрозмовники, групи та «me»).

## Спільні прапорці

- `--channel <name>`: ідентифікатор/псевдонім каналу (обов’язково, коли налаштовано кілька каналів; автоматично, коли налаштовано лише один)
- `--account <id>`: ідентифікатор облікового запису (типово: стандартний для каналу)
- `--json`: вивести JSON

## Примітки

- `directory` призначено, щоб допомогти вам знайти ідентифікатори, які можна вставити в інші команди (особливо `openclaw message send --target ...`).
- Для багатьох каналів результати базуються на конфігурації (списки дозволених / налаштовані групи), а не на живому каталозі провайдера.
- Установлені Plugin каналів усе ще можуть не підтримувати каталог; у такому разі команда повідомляє про непідтримувану операцію каталогу замість перевстановлення Plugin.
- Типовий вивід — це `id` (а іноді `name`), розділені табуляцією; використовуйте `--json` для сценаріїв.

## Використання результатів із `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Формати ідентифікаторів (за каналом)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (група)
- Telegram: `@username` або числовий ідентифікатор чату; групи мають числові ідентифікатори
- Slack: `user:U…` і `channel:C…`
- Discord: `user:<id>` і `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` або `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` і `conversation:<id>`
- Zalo (Plugin): ідентифікатор користувача (Bot API)
- Zalo Personal / `zalouser` (Plugin): ідентифікатор потоку (DM/група) з `zca` (`me`, `friend list`, `group list`)

## Себе ("me")

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

## Пов’язане

- [Довідник CLI](/uk/cli)
