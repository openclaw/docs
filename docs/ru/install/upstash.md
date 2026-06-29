---
read_when:
    - Развертывание OpenClaw в Upstash Box
    - Вам нужна управляемая среда Linux для OpenClaw с доступом к панели управления через SSH-туннель
summary: Размещение OpenClaw на Upstash Box с поддержанием активности и доступом через SSH-туннель
title: Бокс Upstash
x-i18n:
    generated_at: "2026-06-28T23:08:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06d2eb41e1beb0ab3145baa861e0bee7e3efef20324dc4e0e82ba08910937d20
    source_path: install/upstash.md
    workflow: 16
---

Запустите постоянный OpenClaw Gateway в Upstash Box, управляемой среде Linux
с поддержкой жизненного цикла keep-alive.

Для доступа к панели управления используйте SSH-туннель. Не открывайте порт Gateway напрямую
в публичный интернет.

## Предварительные требования

- Учетная запись Upstash
- Upstash Box с keep-alive
- SSH-клиент на вашем локальном компьютере

## Создание Box

Создайте Box с keep-alive в Upstash Console. Запишите Box ID, например
`right-flamingo-14486`, и API-ключ вашего Box.

Upstash поддерживает актуальное руководство по OpenClaw Box по адресу
[Настройка OpenClaw](https://upstash.com/docs/box/guides/openclaw-setup).

## Подключение через SSH-туннель

Пробросьте порт панели управления OpenClaw на свой локальный компьютер. При запросе используйте API-ключ вашего Box
как пароль SSH:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Параметры keepalive уменьшают разрывы неактивного туннеля во время онбординга.

## Установка OpenClaw

Внутри Box:

```bash
sudo npm install -g openclaw
```

## Запуск онбординга

```bash
openclaw onboard --install-daemon
```

Следуйте подсказкам. Скопируйте URL панели управления и токен после завершения онбординга.

## Запуск Gateway

Настройте Gateway для сети Box и запустите его в фоновом режиме:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

При активном SSH-туннеле откройте URL панели управления локально:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## Автоперезапуск

Задайте эту команду как init-скрипт Box, чтобы Gateway перезапускался при запуске Box:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## Устранение неполадок

Если SSH зависает во время онбординга, переподключитесь с чистой конфигурацией SSH и
keepalive:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Это обходит устаревшие локальные настройки `~/.ssh/config` и поддерживает туннель активным
во время периодов простоя сети.

## См. также

- [Удаленный доступ](/ru/gateway/remote)
- [Безопасность Gateway](/ru/gateway/security)
- [Обновление OpenClaw](/ru/install/updating)
