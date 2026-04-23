---
read_when:
    - Ви хочете знайти ідентифікатори контактів/груп/self для каналу
    - Ви розробляєте адаптер каталогу каналу
summary: Довідка CLI для `openclaw directory` (self, peers, groups)
title: каталог
x-i18n:
    generated_at: "2026-04-23T06:17:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a81a037e0a33f77c24b1adabbc4be16ed4d03c419873f3cbdd63f2ce84a1064
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

Пошук у каталозі для каналів, які це підтримують (контакти/peers, групи та «я»).

## Поширені прапорці

- `--channel <name>`: id/псевдонім каналу (обов’язково, якщо налаштовано кілька каналів; автоматично, якщо налаштовано лише один)
- `--account <id>`: id облікового запису (типово: типовий для каналу)
- `--json`: вивід JSON

## Примітки

- `directory` призначений для того, щоб допомогти вам знайти id, які можна вставити в інші команди (особливо `openclaw message send --target ...`).
- Для багатьох каналів результати беруться з конфігурації (allowlists / налаштовані групи), а не з живого каталогу провайдера.
- Типовий вивід — `id` (а іноді `name`), розділені табуляцією; для скриптів використовуйте `--json`.

## Використання результатів із `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Формати id (за каналом)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (група)
- Telegram: `@username` або числовий id чату; групи мають числові id
- Slack: `user:U…` і `channel:C…`
- Discord: `user:<id>` і `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` або `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` і `conversation:<id>`
- Zalo (Plugin): id користувача (Bot API)
- Zalo Personal / `zalouser` (Plugin): id потоку (DM/група) з `zca` (`me`, `friend list`, `group list`)

## Self ("я")

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
