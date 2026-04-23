---
read_when:
    - Ви використовуєте DM у режимі pairing і вам потрібно схвалювати відправників
summary: Довідник CLI для `openclaw pairing` (схвалення/перелік запитів pairing)
title: Pairing
x-i18n:
    generated_at: "2026-04-23T20:48:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4e75b1a12dcddabee19ec68c5a317f097265f95651cb681f95d5b1380a968d2
    source_path: cli/pairing.md
    workflow: 15
---

# `openclaw pairing`

Схвалення або перегляд запитів на DM pairing (для каналів, що підтримують pairing).

Пов’язане:

- Процес pairing: [Pairing](/uk/channels/pairing)

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

Показати список очікуваних запитів на pairing для одного каналу.

Параметри:

- `[channel]`: позиційний ID каналу
- `--channel <channel>`: явний ID каналу
- `--account <accountId>`: ID облікового запису для каналів із кількома обліковими записами
- `--json`: машинозчитуваний вивід

Примітки:

- Якщо налаштовано кілька каналів, що підтримують pairing, ви маєте вказати канал або позиційно, або через `--channel`.
- Канали extension також дозволені, якщо ID каналу коректний.

## `pairing approve`

Схвалити очікуваний код pairing і дозволити цього відправника.

Використання:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>`, якщо налаштовано рівно один канал, що підтримує pairing

Параметри:

- `--channel <channel>`: явний ID каналу
- `--account <accountId>`: ID облікового запису для каналів із кількома обліковими записами
- `--notify`: надіслати підтвердження назад запитувачу в тому самому каналі

## Примітки

- Вхідне значення каналу: передавайте його позиційно (`pairing list telegram`) або через `--channel <channel>`.
- `pairing list` підтримує `--account <accountId>` для каналів із кількома обліковими записами.
- `pairing approve` підтримує `--account <accountId>` і `--notify`.
- Якщо налаштовано лише один канал, що підтримує pairing, дозволяється `pairing approve <code>`.
