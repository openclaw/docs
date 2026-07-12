---
read_when:
    - Розгортання OpenClaw в Upstash Box
    - Вам потрібне кероване середовище Linux для OpenClaw із доступом до панелі керування через SSH-тунель
summary: Розміщення OpenClaw на Upstash Box із підтриманням активності та доступом через SSH-тунель
title: Upstash Box
x-i18n:
    generated_at: "2026-07-12T13:19:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29232c43e0e4940b7445ab8896c9ccd3e81d0fdbdd522d7f50cb8c8057ac18f0
    source_path: install/upstash.md
    workflow: 16
---

Запустіть постійний Gateway OpenClaw в Upstash Box — керованому середовищі Linux
із підтримкою безперервної роботи.

Для доступу до панелі керування використовуйте тунель SSH. Не надавайте прямого
доступу до порту Gateway із загальнодоступного інтернету.

## Передумови

- Обліковий запис Upstash
- Upstash Box із підтримкою безперервної роботи
- Клієнт SSH на локальному комп’ютері

## Створення Box

Створіть Box із підтримкою безперервної роботи в консолі Upstash. Запишіть ідентифікатор Box (наприклад,
`right-flamingo-14486`) і ключ API вашого Box.

Актуальні вказівки Upstash щодо налаштування OpenClaw Box наведено на сторінці
[Налаштування OpenClaw](https://upstash.com/docs/box/guides/openclaw-setup).

## Підключення через тунель SSH

Перенаправте порт панелі керування OpenClaw на локальний комп’ютер. Коли з’явиться запит,
використайте ключ API вашого Box як пароль SSH:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Параметри підтримання з’єднання зменшують кількість розривів неактивного тунелю під час початкового налаштування.

## Встановлення OpenClaw

Усередині Box:

```bash
sudo npm install -g openclaw
```

## Запуск початкового налаштування

```bash
openclaw onboard --install-daemon
```

Дотримуйтеся підказок. Після завершення початкового налаштування скопіюйте URL-адресу панелі керування та токен.

## Запуск Gateway

Налаштуйте Gateway для мережі Box і запустіть його у фоновому режимі:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

Коли тунель SSH активний, відкрийте URL-адресу панелі керування локально:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## Автоматичний перезапуск

Установіть цю команду як сценарій ініціалізації Box, щоб Gateway перезапускався під час запуску
Box:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## Усунення несправностей

Якщо SSH зависає під час початкового налаштування, повторно підключіться з чистою конфігурацією SSH і
параметрами підтримання з’єднання:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Це дає змогу обійти застарілі локальні налаштування `~/.ssh/config` і підтримувати тунель активним
у періоди бездіяльності мережі.

## Пов’язані матеріали

- [Віддалений доступ](/uk/gateway/remote)
- [Безпека Gateway](/uk/gateway/security)
- [Оновлення OpenClaw](/uk/install/updating)
