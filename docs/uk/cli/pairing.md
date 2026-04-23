---
read_when:
    - Ви використовуєте DM у режимі сполучення й вам потрібно підтверджувати відправників
summary: Довідка CLI для `openclaw pairing` (підтвердження/перегляд запитів на сполучення)
title: сполучення
x-i18n:
    generated_at: "2026-04-23T06:18:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 122a608ef83ec2b1011fdfd1b59b94950a4dcc8b598335b0956e2eedece4958f
    source_path: cli/pairing.md
    workflow: 15
---

# `openclaw pairing`

Підтверджуйте або переглядайте запити на DM-сполучення (для каналів, що підтримують сполучення).

Пов’язано:

- Потік сполучення: [Сполучення](/uk/channels/pairing)

## Команди

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

Показати список очікуваних запитів на сполучення для одного каналу.

Параметри:

- `[channel]`: позиційний id каналу
- `--channel <channel>`: явний id каналу
- `--account <accountId>`: id облікового запису для каналів із кількома обліковими записами
- `--json`: машинозчитуваний вивід

Примітки:

- Якщо налаштовано кілька каналів, що підтримують сполучення, ви маєте вказати канал або позиційно, або через `--channel`.
- Канали extension дозволені, якщо id каналу є коректним.

## `pairing approve`

Підтвердити код очікуваного сполучення і дозволити цього відправника.

Використання:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>`, коли налаштовано рівно один канал, що підтримує сполучення

Параметри:

- `--channel <channel>`: явний id каналу
- `--account <accountId>`: id облікового запису для каналів із кількома обліковими записами
- `--notify`: надіслати підтвердження назад запитувачу в тому самому каналі

## Примітки

- Вхідне значення каналу: передавайте його позиційно (`pairing list telegram`) або через `--channel <channel>`.
- `pairing list` підтримує `--account <accountId>` для каналів із кількома обліковими записами.
- `pairing approve` підтримує `--account <accountId>` і `--notify`.
- Якщо налаштовано лише один канал, що підтримує сполучення, дозволено `pairing approve <code>`.
