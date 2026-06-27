---
read_when:
    - Розгортання OpenClaw в Upstash Box
    - Вам потрібне кероване середовище Linux для OpenClaw з доступом до панелі через SSH-тунель
summary: Розмістіть OpenClaw на Upstash Box із keep-alive та доступом через SSH-тунель
title: Бокс Upstash
x-i18n:
    generated_at: "2026-06-27T17:43:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06d2eb41e1beb0ab3145baa861e0bee7e3efef20324dc4e0e82ba08910937d20
    source_path: install/upstash.md
    workflow: 16
---

Запустіть постійний OpenClaw Gateway на Upstash Box, керованому середовищі Linux
із підтримкою життєвого циклу keep-alive.

Використовуйте SSH-тунель для доступу до панелі керування. Не відкривайте порт Gateway безпосередньо
для публічного інтернету.

## Передумови

- Обліковий запис Upstash
- Upstash Box із keep-alive
- SSH-клієнт на вашій локальній машині

## Створення Box

Створіть Box із keep-alive у Upstash Console. Занотуйте ID Box, наприклад
`right-flamingo-14486`, і API-ключ вашого Box.

Upstash підтримує поточний покроковий посібник OpenClaw Box за адресою
[Налаштування OpenClaw](https://upstash.com/docs/box/guides/openclaw-setup).

## Підключення через SSH-тунель

Переадресуйте порт панелі керування OpenClaw на вашу локальну машину. Використовуйте API-ключ вашого Box
як пароль SSH, коли з’явиться запит:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Параметри keepalive зменшують кількість розривів неактивного тунелю під час онбордингу.

## Встановлення OpenClaw

Усередині Box:

```bash
sudo npm install -g openclaw
```

## Запуск онбордингу

```bash
openclaw onboard --install-daemon
```

Дотримуйтеся підказок. Скопіюйте URL панелі керування та токен після завершення онбордингу.

## Запуск Gateway

Налаштуйте Gateway для мережі Box і запустіть його у фоновому режимі:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

За активного SSH-тунелю відкрийте URL панелі керування локально:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## Автоматичний перезапуск

Установіть цю команду як init-скрипт Box, щоб Gateway перезапускався під час запуску Box:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## Усунення несправностей

Якщо SSH зависає під час онбордингу, перепідключіться з чистою конфігурацією SSH і
keepalive:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Це обходить застарілі локальні налаштування `~/.ssh/config` і підтримує тунель активним
під час періодів неактивності мережі.

## Пов’язане

- [Віддалений доступ](/uk/gateway/remote)
- [Безпека Gateway](/uk/gateway/security)
- [Оновлення OpenClaw](/uk/install/updating)
