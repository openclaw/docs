---
read_when:
    - Развертывание OpenClaw в Upstash Box
    - Вам нужна управляемая среда Linux для OpenClaw с доступом к панели управления через SSH-туннель
summary: Разместите OpenClaw на Upstash Box с поддержанием активности и доступом через SSH-туннель
title: Upstash Box
x-i18n:
    generated_at: "2026-07-12T11:30:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29232c43e0e4940b7445ab8896c9ccd3e81d0fdbdd522d7f50cb8c8057ac18f0
    source_path: install/upstash.md
    workflow: 16
---

Запустите постоянный Gateway OpenClaw в Upstash Box — управляемой среде Linux
с поддержкой непрерывной работы.

Для доступа к панели управления используйте SSH-туннель. Не открывайте порт Gateway напрямую
для публичного доступа из интернета.

## Предварительные требования

- Учетная запись Upstash
- Upstash Box с поддержкой непрерывной работы
- SSH-клиент на локальном компьютере

## Создание Box

Создайте Box с поддержкой непрерывной работы в консоли Upstash. Запишите идентификатор Box (например,
`right-flamingo-14486`) и API-ключ Box.

Актуальное руководство Upstash по настройке OpenClaw Box доступно на странице
[Настройка OpenClaw](https://upstash.com/docs/box/guides/openclaw-setup).

## Подключение через SSH-туннель

Перенаправьте порт панели управления OpenClaw на локальный компьютер. При появлении запроса
используйте API-ключ Box в качестве пароля SSH:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Параметры поддержания соединения уменьшают вероятность разрыва неактивного туннеля во время первоначальной настройки.

## Установка OpenClaw

Внутри Box:

```bash
sudo npm install -g openclaw
```

## Первоначальная настройка

```bash
openclaw onboard --install-daemon
```

Следуйте подсказкам. После завершения первоначальной настройки скопируйте URL-адрес панели управления и токен.

## Запуск Gateway

Настройте Gateway для сети Box и запустите его в фоновом режиме:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

При активном SSH-туннеле откройте URL-адрес панели управления локально:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## Автоматический перезапуск

Укажите эту команду в качестве сценария инициализации Box, чтобы Gateway перезапускался при запуске
Box:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## Устранение неполадок

Если SSH зависает во время первоначальной настройки, повторно подключитесь с чистой конфигурацией SSH и
параметрами поддержания соединения:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Это позволяет обойти устаревшие локальные настройки `~/.ssh/config` и поддерживать туннель активным
в периоды отсутствия сетевой активности.

## Связанные материалы

- [Удаленный доступ](/ru/gateway/remote)
- [Безопасность Gateway](/ru/gateway/security)
- [Обновление OpenClaw](/ru/install/updating)
