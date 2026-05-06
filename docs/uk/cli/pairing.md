---
read_when:
    - Ви використовуєте особисті повідомлення в режимі сполучення й маєте схвалити відправників
summary: Довідка CLI для `openclaw pairing` (схвалення/перегляд списку запитів на сполучення)
title: Сполучення
x-i18n:
    generated_at: "2026-05-06T16:00:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 022018239ab1134b18986be42b8e019f412a1a730a9671f422979909c4a31dc5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Схвалюйте або переглядайте запити на сполучення в DM (для каналів, які підтримують сполучення).

Пов’язане:

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

Перелічує очікувані запити на сполучення для одного каналу.

Параметри:

- `[channel]`: позиційний ідентифікатор каналу
- `--channel <channel>`: явний ідентифікатор каналу
- `--account <accountId>`: ідентифікатор облікового запису для каналів із кількома обліковими записами
- `--json`: машиночитаний вивід

Примітки:

- Якщо налаштовано кілька каналів із підтримкою сполучення, потрібно вказати канал позиційно або за допомогою `--channel`.
- Канали розширень дозволені, якщо ідентифікатор каналу чинний.

## `pairing approve`

Схвалює очікуваний код сполучення й дозволяє цього відправника.

Використання:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>`, коли налаштовано рівно один канал із підтримкою сполучення

Параметри:

- `--channel <channel>`: явний ідентифікатор каналу
- `--account <accountId>`: ідентифікатор облікового запису для каналів із кількома обліковими записами
- `--notify`: надіслати підтвердження запитувачу в тому самому каналі

Початкове налаштування власника:

- Якщо `commands.ownerAllowFrom` порожній, коли ви схвалюєте код сполучення, OpenClaw також записує схваленого відправника як власника команд, використовуючи запис у межах каналу, наприклад `telegram:123456789`.
- Це початково налаштовує лише першого власника. Подальші схвалення сполучення не замінюють і не розширюють `commands.ownerAllowFrom`.
- Власник команд — це обліковий запис оператора-людини, якому дозволено виконувати команди лише для власника та схвалювати небезпечні дії, зокрема `/diagnostics`, `/export-trajectory`, `/config` і схвалення exec.

## Примітки

- Ввід каналу: передайте його позиційно (`pairing list telegram`) або за допомогою `--channel <channel>`.
- `pairing list` підтримує `--account <accountId>` для каналів із кількома обліковими записами.
- `pairing approve` підтримує `--account <accountId>` і `--notify`.
- Якщо налаштовано лише один канал із підтримкою сполучення, дозволено `pairing approve <code>`.
- Якщо ви схвалили відправника до появи цього початкового налаштування, запустіть `openclaw doctor`; він попереджає, коли власника команд не налаштовано, і показує команду `openclaw config set commands.ownerAllowFrom ...`, щоб це виправити.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Сполучення каналів](/uk/channels/pairing)
