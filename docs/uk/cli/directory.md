---
read_when:
    - Ви хочете знайти контакти/групи/id власного облікового запису для каналу
    - Ви розробляєте адаптер каталогу каналу
summary: Довідка CLI для `openclaw directory` (власний обліковий запис, peers, групи)
title: Каталог
x-i18n:
    generated_at: "2026-04-23T20:47:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b6bd2a4787102f5e0908d9965a2f92d3d59f9a30e5126ef84d4dc3d23a3c2ad
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

Пошук у каталозі для каналів, які це підтримують (контакти/peers, групи та “me”).

## Поширені прапорці

- `--channel <name>`: id/псевдонім каналу (обов’язково, коли налаштовано кілька каналів; автоматично, коли налаштовано лише один)
- `--account <id>`: id облікового запису (типово: типовий обліковий запис каналу)
- `--json`: вивести JSON

## Примітки

- `directory` призначений для того, щоб допомогти вам знайти ID, які можна вставити в інші команди (особливо в `openclaw message send --target ...`).
- Для багатьох каналів результати беруться з конфігурації (allowlist / налаштовані групи), а не з живого каталогу provider-а.
- Типовий вивід — `id` (а іноді `name`), розділені табуляцією; для скриптів використовуйте `--json`.

## Використання результатів із `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Формати ID (за каналами)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (група)
- Telegram: `@username` або числовий id чату; групи — це числові id
- Slack: `user:U…` і `channel:C…`
- Discord: `user:<id>` і `channel:<id>`
- Matrix (plugin): `user:@user:server`, `room:!roomId:server` або `#alias:server`
- Microsoft Teams (plugin): `user:<id>` і `conversation:<id>`
- Zalo (plugin): id користувача (Bot API)
- Zalo Personal / `zalouser` (plugin): id треду (DM/група) з `zca` (`me`, `friend list`, `group list`)

## Власний обліковий запис ("me")

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
