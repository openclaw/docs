---
read_when:
    - Ви використовуєте приватні повідомлення в режимі сполучення й маєте схвалити відправників
summary: Довідник CLI для `openclaw pairing` (схвалення/перегляд списку запитів на сполучення)
title: Сполучення
x-i18n:
    generated_at: "2026-04-28T22:44:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: bffc70a8c08e298f42c8fbc2238fce06993572e72f333e87ad18dea3cf33fab5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Схвалюйте або переглядайте запити на прив'язування в DM (для каналів, що підтримують прив'язування).

Пов'язане:

- Потік прив'язування: [Прив'язування](/uk/channels/pairing)

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

Перелічує очікувані запити на прив'язування для одного каналу.

Параметри:

- `[channel]`: позиційний ідентифікатор каналу
- `--channel <channel>`: явний ідентифікатор каналу
- `--account <accountId>`: ідентифікатор облікового запису для каналів із кількома обліковими записами
- `--json`: машинозчитуваний вивід

Примітки:

- Якщо налаштовано кілька каналів із підтримкою прив'язування, потрібно вказати канал позиційно або через `--channel`.
- Канали Plugin дозволені, якщо ідентифікатор каналу чинний.

## `pairing approve`

Схвалює очікуваний код прив'язування та дозволяє цього відправника.

Використання:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>`, коли налаштовано рівно один канал із підтримкою прив'язування

Параметри:

- `--channel <channel>`: явний ідентифікатор каналу
- `--account <accountId>`: ідентифікатор облікового запису для каналів із кількома обліковими записами
- `--notify`: надіслати підтвердження запитувачу в тому самому каналі

Початкове налаштування власника:

- Якщо `commands.ownerAllowFrom` порожній, коли ви схвалюєте код прив'язування, OpenClaw також записує схваленого відправника як власника команд, використовуючи запис у межах каналу, наприклад `telegram:123456789`.
- Це виконує початкове налаштування лише першого власника. Подальші схвалення прив'язування не замінюють і не розширюють `commands.ownerAllowFrom`.
- Власник команд — це обліковий запис людини-оператора, якій дозволено запускати команди лише для власника та схвалювати небезпечні дії, як-от `/diagnostics`, `/export-trajectory`, `/config` і схвалення exec.

## Примітки

- Ввід каналу: передайте його позиційно (`pairing list telegram`) або через `--channel <channel>`.
- `pairing list` підтримує `--account <accountId>` для каналів із кількома обліковими записами.
- `pairing approve` підтримує `--account <accountId>` і `--notify`.
- Якщо налаштовано лише один канал із підтримкою прив'язування, дозволено `pairing approve <code>`.
- Якщо ви схвалили відправника до появи цього початкового налаштування, запустіть `openclaw doctor`; він попередить, коли власника команд не налаштовано, і покаже команду `openclaw config set commands.ownerAllowFrom ...`, щоб це виправити.

## Пов'язане

- [Довідник CLI](/uk/cli)
- [Прив'язування каналу](/uk/channels/pairing)
